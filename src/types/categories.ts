import type {
    GetApiV1CategoriesByIdResponse,
    PatchApiV1CategoriesByIdData,
    PostApiV1CategoriesData,
} from "@/client";

export type Category = GetApiV1CategoriesByIdResponse;

export type CreateCategory = PostApiV1CategoriesData["body"];

export type UpdateCategory = PatchApiV1CategoriesByIdData["body"];
