"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Heatmap, HeatmapCell } from "@/components/heatmap/Heatmap";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { HabitForm } from "@/components/habit/HabitForm";

interface Habit {
  id: string;
  name: string;
  description: string | null;
  color: string;
  type: string;
  targetPerDay: number;
}

interface HeatmapResponse {
  year: number;
  timezone: string;
  cells: HeatmapCell[];
  max: number;
}

interface StatsResponse {
  current: number;
  longest: number;
  totalCompletions: number;
  last30Days: number;
  completionRate: number;
}

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const habitId = params.id as string;
  const [year] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch habit details
  const { data: habit } = useQuery<Habit>({
    queryKey: ["habit", habitId],
    queryFn: async () => {
      const res = await fetch(`/api/habits/${habitId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  // Fetch heatmap for this habit
  const { data: heatmapData } = useQuery<HeatmapResponse>({
    queryKey: ["heatmap", year, habitId],
    queryFn: async () => {
      const res = await fetch(`/api/heatmap?year=${year}&habitId=${habitId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["stats", habitId],
    queryFn: async () => {
      const res = await fetch(`/api/stats?habitId=${habitId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Update habit
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Habit>) => {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit", habitId] });
      queryClient.invalidateQueries({ queryKey: ["heatmap", year, habitId] });
      setEditing(false);
    },
  });

  // Delete habit
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  // Toggle a day on the heatmap
  const toggleMutation = useMutation({
    mutationFn: async ({ date, hasEntry }: { date: string; hasEntry: boolean }) => {
      if (hasEntry) {
        await fetch(`/api/habits/${habitId}/entries?date=${date}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`/api/habits/${habitId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["heatmap", year, habitId] });
      queryClient.invalidateQueries({ queryKey: ["stats", habitId] });
    },
  });

  if (!habit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back
          </button>
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            {habit.name}
          </h1>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Edit form */}
        {editing && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <HabitForm
              initial={{
                name: habit.name,
                description: habit.description || "",
                color: habit.color,
                type: habit.type,
                targetPerDay: habit.targetPerDay,
              }}
              onSubmit={(data) => updateMutation.mutate(data)}
              onCancel={() => setEditing(false)}
              isLoading={updateMutation.isPending}
            />
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300 mb-3">
              Are you sure? This will archive the habit and hide it from your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm dark:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <section className="flex flex-wrap gap-6">
            <StreakBadge current={stats.current} longest={stats.longest} />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCompletions}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total completions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.completionRate}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last 30 days
              </div>
            </div>
          </section>
        )}

        {/* Heatmap */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {year}
          </h2>
          {heatmapData ? (
            <Heatmap
              cells={heatmapData.cells}
              year={year}
              baseColor={habit.color}
              onCellClick={(date, value) => {
                toggleMutation.mutate({ date, hasEntry: value > 0 });
              }}
            />
          ) : (
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click a day to toggle completion
          </p>
        </section>
      </main>
    </div>
  );
}
