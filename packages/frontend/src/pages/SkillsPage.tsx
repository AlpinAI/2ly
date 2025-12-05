/**
 * Skills Page
 *
 * WHY: Manage and view skills with detailed information.
 * Shows skill list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Skill table with search
 * - 1/3: Skill detail panel
 *
 * FEATURES:
 * - Real-time skill updates (subscription)
 * - Search by name/description/tool names
 * - Click skill to view details
 * - Show skill tools and metadata
 */

import { useMemo, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { SkillTable } from '@/components/skills/skill-table';
import { SkillDetail } from '@/components/skills/skill-detail';
import { Button } from '@/components/ui/button';
import { useSkills } from '@/hooks/useSkills';
import { useCreateSkillDialog, useManageToolsDialog, useAISkillBuilderDialog } from '@/stores/uiStore';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function SkillsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedId, setSelectedId } = useUrlSync();
  const { openDialog } = useCreateSkillDialog();

  // Fetch skills via Apollo subscription
  const { filteredSkills, loading, error, filters } = useSkills(workspaceId || '');

  console.log('filteredSkills', filteredSkills);

  // Get selected skill from URL
  const selectedSkill = useMemo(() => {
    if (!selectedId) return null;
    return filteredSkills.find((ts) => ts.id === selectedId) || null;
  }, [selectedId, filteredSkills]);

  // Auto-close detail panel if skill not found
  useEffect(() => {
    if (selectedId && !selectedSkill && !loading) {
      // Skill not found - might have been deleted or invalid ID
      setSelectedId(null);
    }
  }, [selectedId, selectedSkill, loading, setSelectedId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading skills</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const manageToolsDialog = useManageToolsDialog();
  const { openDialog: openAIDialog } = useAISkillBuilderDialog();

  const handleCreateSkill = () => {
    openDialog((skillId) => {
      setSelectedId(skillId);
      manageToolsDialog.setSelectedSkillId(skillId);
      manageToolsDialog.setOpen(true);
    });
  };

  const handleCreateWithAI = () => {
    openAIDialog((skillId) => {
      setSelectedId(skillId);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Skills</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your skills and organize your tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateWithAI} variant="secondary" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Create with AI
          </Button>
          <Button onClick={handleCreateSkill} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Skill
          </Button>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <SkillTable
            skills={filteredSkills}
            selectedSkillId={selectedId}
            onSelectSkill={setSelectedId}
            search={filters.search}
            onSearchChange={filters.setSearch}
            loading={loading}
          />
        }
        detail={selectedSkill ? <SkillDetail skill={selectedSkill} /> : null}
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
