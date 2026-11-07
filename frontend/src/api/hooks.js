import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, del, get, patch, post } from "./client";

// Список ресурса DRF с фильтрами: useList("participants", { event: 1 })
export function useList(resource, params = {}, options = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return useQuery({
    queryKey: [resource, params],
    queryFn: () => get(`${resource}/${qs ? `?${qs}` : ""}`),
    ...options,
  });
}

export function useItem(resource, id, options = {}) {
  return useQuery({
    queryKey: [resource, "item", String(id)],
    queryFn: () => get(`${resource}/${id}/`),
    enabled: id != null,
    ...options,
  });
}

// create / update / remove с автоматическим обновлением списков
export function useCrud(resource, alsoInvalidate = []) {
  const qc = useQueryClient();
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: [resource] });
    alsoInvalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
  };
  return {
    create: useMutation({ mutationFn: (body) => post(`${resource}/`, body), onSuccess }),
    update: useMutation({ mutationFn: ({ id, ...body }) => patch(`${resource}/${id}/`, body), onSuccess }),
    remove: useMutation({ mutationFn: (id) => del(`${resource}/${id}/`), onSuccess }),
  };
}

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => api("me/") });
