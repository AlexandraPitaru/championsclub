import { useMutation } from "@tanstack/react-query";
import {
    generateManagerTeamSummary,
    type ManagerTeamSummaryRequest,
} from "../api/managerSummaryService";

export function useManagerTeamSummary() {
    return useMutation({
        mutationFn: (payload: ManagerTeamSummaryRequest) =>
            generateManagerTeamSummary(payload),
    });
}