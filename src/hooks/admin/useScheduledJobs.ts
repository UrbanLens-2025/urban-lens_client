"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getScheduledJobs, getScheduledJobTypes, runScheduledJob, GetScheduledJobsParams } from "@/api/admin";

export function useScheduledJobs(params: GetScheduledJobsParams) {
  return useQuery({
    queryKey: ["adminScheduledJobs", params],
    queryFn: () => getScheduledJobs(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useScheduledJobTypes() {
  return useQuery({
    queryKey: ["adminScheduledJobTypes"],
    queryFn: () => getScheduledJobTypes(),
  });
}

export function useRunScheduledJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduledJobId: number) => runScheduledJob(scheduledJobId),
    onSuccess: () => {
      toast.success("Job scheduled to run within the next minute");
      queryClient.invalidateQueries({ queryKey: ["adminScheduledJobs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to run job. Please try again.");
    },
  });
}

