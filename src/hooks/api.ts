"use client";

import { useCallback, useEffect, useState } from "react";

import {
    CategoriesService,
    EquipmentsService,
    GetApiV1CategoriesResponses,
    GetApiV1EquipmentsResponses,
    GetApiV1RoomsResponses,
    RoomsService,
    UsersService,
} from "@/client";
import type { User } from "@/types/users";

export const useEquipments = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);
    const [equipments, setEquipments] = useState<
        GetApiV1EquipmentsResponses[200]["data"]
    >([]);

    const fetchEquipments = useCallback(async () => {
        const { data, error } = await EquipmentsService.getApiV1Equipments({
            query: {
                limit: limit,
                offset: (page - 1) * limit,
            },
        });
        if (data) setEquipments(data.data);

        if (error?.message === "Could not validate credentials") {
            console.log(error?.message);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchEquipments();
    }, [fetchEquipments]);

    return {
        equipments,
        page,
        setPage,
        limit,
        setLimit,
        mutate: fetchEquipments,
    };
};

export const useUsers = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);
    const [users, setUsers] = useState<User[]>([]);

    const fetchUsers = useCallback(async () => {
        const { data, error } = await UsersService.getApiV1Users({
            query: {
                limit: limit,
                offset: (page - 1) * limit,
            },
        });
        if (data?.data) {
            setUsers(data.data);
        }

        if (error?.message === "Could not validate credentials") {
            console.log(error?.message);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, setUsers, setPage, setLimit, mutate: fetchUsers };
};

export const useCategories = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);
    const [categories, setCategories] = useState<
        GetApiV1CategoriesResponses[200]["data"]
    >([]);

    const fetchCategories = useCallback(async () => {
        const { data, error } = await CategoriesService.getApiV1Categories({
            query: {
                limit: limit,
                offset: (page - 1) * limit,
            },
        });
        if (data) setCategories(data.data);
        if (error) {
            console.error(error);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, setPage, setLimit, mutate: fetchCategories };
};

export const useRooms = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);
    const [rooms, setRooms] = useState<GetApiV1RoomsResponses[200]["data"]>([]);

    const fetchRooms = useCallback(async () => {
        const { data, error } = await RoomsService.getApiV1Rooms({
            query: {
                limit: limit,
                offset: (page - 1) * limit,
            },
        });
        if (data) setRooms(data.data);
        if (error) {
            console.error(error);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    return { rooms, setPage, setLimit, mutate: fetchRooms };
};
