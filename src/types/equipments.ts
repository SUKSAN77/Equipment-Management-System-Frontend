import type {
    GetApiV1EquipmentsByIdResponse,
    PatchApiV1EquipmentsByIdData,
    PostApiV1EquipmentsData,
} from "@/client";

export type Equipment = GetApiV1EquipmentsByIdResponse;

export type CreateEquipment = PostApiV1EquipmentsData["body"];

export type UpdateEquipment = PatchApiV1EquipmentsByIdData["body"];
