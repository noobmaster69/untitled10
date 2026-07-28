"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heatmap, HeatmapCell } from "@/components/heatmap/Heatmap";
import { HabitRow } from "@/components/habit/HabitRow";
import { HabitForm } from "@/components/habit/HabitForm";

interface Habit {
  id: string;
  name: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      const res = await fetch("/api/habits");
      if (!res.ok) throw new Error("Failed to fetch habits");
      return res.json();
    },
  });

  const { data: heatmapData } = useQuery<HeatmapResponse>({
    queryKey: ["heatmap", year],
    queryFn: async () => {
      const res = await fetch(`/api/heatmap?year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch heatmap");
      return res.json();
    },
  });

  const { data: todayEntries = {} } = useQuery<Record<string, boolean>>({
    queryKey: ["todayEntries", habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const result: Record<string, boolean> = {};
      for (const habit of habits) {
        const res = await fetch(
          `/api/habits/${habit.id}/entries?from=${today}&to=${today}`
        );
        if (res.ok) {
          const entries = await res.json();
          result[habit.id] = entries.length > 0;
        }
      }
      return result;
    },
    enabled: habits.length > 0,
  });

  const { data: streaks = {} } = useQuery<Record<string, number>>({
    queryKey: ["streaks", habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const result: Record<string, number> = {};
      for (const habit of habits) {
        const res = await fetch(`/api/stats?habitId=${habit.id}`);
        if (res.ok) {
          const data = await res.json();
          result[habit.id] = data.current;
        }
      }
      return result;
    },
    enabled: habits.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      color: string;
      type: string;
      targetPerDay: number;
    }) => {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create habit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setShowForm(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, isDone }: { habitId: string; isDone: boolean }) => {
      if (isDone) {
        const today = new Date().toISOString().split("T")[0];
        await fetch(`/api/habits/${habitId}/entries?date=${today}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`/api/habits/${habitId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }
    },
    onMutate: async ({ habitId, isDone }) => {
      queryClient.setQueryData<Record<string, boolean>>(
        ["todayEntries", habits.map((h) => h.id).join(",")],
        (old) => ({
          ...old,
          [habitId]: !isDone,
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todayEntries"] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Habit Tracker
          </h1>
          <button
            onClick={() => router.push("/settings")}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Settings
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All habits
            </h2>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Select year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {heatmapData ? (
            <Heatmap
              cells={heatmapData.cells}
              year={year}
              baseColor="#ef4444"
              showSummary
              onCellClick={(date) => router.push(`/journal/${date}`)}
            />
          ) : (
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Click a day to open its journal.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your habits
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              + New habit
            </button>
          </div>

          {showForm && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <HabitForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setShowForm(false)}
                isLoading={createMutation.isPending}
              />
            </div>
          )}

          {habits.length === 0 && !showForm ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No habits yet</p>
              <p className="text-sm">Create your first habit to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  streak={streaks[habit.id] || 0}
                  isDoneToday={todayEntries[habit.id] || false}
                  onToggle={() =>
                    toggleMutation.mutate({
                      habitId: habit.id,
                      isDone: todayEntries[habit.id] || false,
                    })
                  }
                  onNavigate={() => router.push(`/habits/${habit.id}`)}
                  isToggling={toggleMutation.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
