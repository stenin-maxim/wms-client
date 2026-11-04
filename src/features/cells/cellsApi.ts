// src/features/cells/cellsApi.ts
import { baseApi } from '@/api/baseApi';

export interface CellDto {
    id: string;
    address: string;
    zoneName: string;
    rack: string;
    shelf: string;
    position: string;
    barcode: string;
    blocked: boolean;
}

export interface CreateCellRequest {
    zoneName: string;
    rack: string;
    shelf: string;
    position: string;
}

export interface UpdateCellBlockRequest {
    id: string;
    isBlocked: boolean;
}

export const cellsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // спискок ячеек
        getCells: builder.query<CellDto[], void>({
            query: () => 'cells',
            providesTags: ['Cells'],
        }),
        // создание ячейки
        createCell: builder.mutation<CellDto, CreateCellRequest>({
            query: (newCell) => ({
                url: 'cells',
                method: 'POST',
                body: newCell,
            }),
            invalidatesTags: ['Cells'], // Авто-перезапрос таблицы
        }),
        // PATCH-запрос на блокировку (через JSON тело)
        toggleCellBlock: builder.mutation<CellDto, UpdateCellBlockRequest>({
            query: ({ id, isBlocked }) => ({
                url: `cells/${id}/block`,
                method: 'PATCH',
                body: { blocked: isBlocked },
            }),
            invalidatesTags: ['Cells'],
        }),
        // GET-запрос ZPL-кода этикетки
        getCellLabel: builder.query<{ zplCode: string }, string>({
            query: (id) => `labels/cell/${id}`,
        }),
    }),
});

export const { 
    useGetCellsQuery, 
    useCreateCellMutation, 
    useToggleCellBlockMutation,
    useLazyGetCellLabelQuery // Ленивый хук — сработает только при клике на печать
} = cellsApi;