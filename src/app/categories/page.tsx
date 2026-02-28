'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Group, Button, Text, Loader, ActionIcon } from '@mantine/core';
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase, Category } from '@/lib/supabase';
import { CategoryModal } from '@/components/CategoryModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import Link from 'next/link';

export default function CategoriesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);

        const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .order('position', { ascending: true });

        setCategories(cats || []);

        // Get source counts per category
        if (cats && cats.length > 0) {
            const { data: sc } = await supabase
                .from('source_categories')
                .select('category_id');

            const counts: Record<string, number> = {};
            (sc || []).forEach(item => {
                counts[item.category_id] = (counts[item.category_id] || 0) + 1;
            });
            setSourceCounts(counts);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleDelete = async () => {
        if (!deleteCategory) return;
        setDeleting(true);

        await supabase.from('categories').delete().eq('id', deleteCategory.id);
        setCategories(prev => prev.filter(c => c.id !== deleteCategory.id));
        setDeleteCategory(null);
        setDeleting(false);
    };

    if (authLoading) {
        return (
            <Container size="sm" py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="white" />
            </Container>
        );
    }

    if (!user) return null;

    return (
        <Container size="sm" px="md" py="lg">
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between" align="center">
                    <Title order={2}>Kategorien</Title>
                    <Button
                        leftSection={<Plus size={16} />}
                        onClick={() => { setEditCategory(null); setShowModal(true); }}
                        styles={{ root: { backgroundColor: '#fff', color: '#000' } }}
                    >
                        Neue Kategorie
                    </Button>
                </Group>

                <Text size="sm" style={{ opacity: 0.5 }}>
                    Organisiere deine Quellen in Kategorien für einen übersichtlichen Feed.
                </Text>

                {/* Category list */}
                {loading ? (
                    <Stack gap="md">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />
                        ))}
                    </Stack>
                ) : categories.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <FolderOpen size={28} />
                        </div>
                        <div className="empty-state__title">Keine Kategorien</div>
                        <div className="empty-state__description">
                            Erstelle Kategorien wie &quot;Tech&quot;, &quot;News&quot; oder &quot;Sport&quot;, um deine Quellen zu organisieren.
                        </div>
                    </div>
                ) : (
                    <Stack gap="sm">
                        {categories.map(category => (
                            <div key={category.id} className="category-card">
                                <div
                                    className="category-card__color"
                                    style={{ backgroundColor: category.color }}
                                />

                                <Link
                                    href={`/?category=${category.id}`}
                                    className="category-card__body"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div className="category-card__name">{category.name}</div>
                                    <div className="category-card__count">
                                        {sourceCounts[category.id] || 0} Quellen
                                    </div>
                                </Link>

                                <div className="category-card__actions">
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        onClick={() => {
                                            setEditCategory(category);
                                            setShowModal(true);
                                        }}
                                    >
                                        <Edit2 size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        onClick={() => setDeleteCategory(category)}
                                    >
                                        <Trash2 size={14} />
                                    </ActionIcon>
                                </div>
                            </div>
                        ))}
                    </Stack>
                )}
            </Stack>

            {/* Category Modal */}
            <CategoryModal
                opened={showModal}
                onClose={() => { setShowModal(false); setEditCategory(null); }}
                onSaved={loadData}
                category={editCategory}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                opened={!!deleteCategory}
                onClose={() => setDeleteCategory(null)}
                onConfirm={handleDelete}
                message={`"${deleteCategory?.name}" wird gelöscht. Quellen werden nicht entfernt.`}
                loading={deleting}
            />
        </Container>
    );
}
