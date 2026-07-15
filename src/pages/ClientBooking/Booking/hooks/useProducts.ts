import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Produto } from "../../types";

export function useProducts() {
  const query = useQuery<Produto[]>({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data } = await api.get("/products");
      return data;
    },
  });

  return {
    produtos: query.data ?? [],
    loadingProdutos: query.isLoading,
  };
}