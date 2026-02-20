import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { useCreateGoal } from '@/api/goals';
import { solToLamports } from '@/lib/solana/utils';
import { SystemProgram } from '@solana/web3.js';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGoalModal({ open, onOpenChange }: Props) {
  const create = useCreateGoal();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSol, setTargetSol] = useState('');

  const handleCreate = async () => {
    const goalId = BigInt(Date.now());
    const targetAmount = solToLamports(parseFloat(targetSol));
    await create.mutateAsync({ goalId, title, description, targetAmount, tokenMint: SystemProgram.programId.toBase58() });
    onOpenChange(false);
    setTitle(''); setDescription(''); setTargetSol('');
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create Fundraising Goal">
      <div className="flex flex-col gap-4 min-w-[320px] pt-2">
        <Input placeholder="Goal title (e.g. New Microphone)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <Input type="number" placeholder="Target amount (SOL)" value={targetSol} onChange={(e) => setTargetSol(e.target.value)} min="0" step="0.1" />
        <Button fullWidth onClick={handleCreate} disabled={!title || !targetSol || parseFloat(targetSol) <= 0 || create.isPending} loading={create.isPending}>
          Create Goal
        </Button>
      </div>
    </Modal>
  );
}
