// src/features/employees/employeesApi.ts
import { baseApi } from '@/api/baseApi';
import { type UserProfile } from '@/features/auth/authSlice';

export interface CreateEmployeeRequest {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'MANAGER' | 'STOREKEEPER' | 'PICKER' | 'AUDITOR';
    assignedEquipment?: string;
}

export interface UpdateEmployeeStatusRequest {
    employeeId: string;
    status: 'ACTIVE' | 'BLOCKED';
}

export const employeesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getEmployees: builder.query<UserProfile[], void>({
            query: () => 'employees',
            providesTags: ['Auth'],
        }),
        // Нанять нового сотрудника
        createEmployee: builder.mutation<UserProfile, CreateEmployeeRequest>({
            query: (newEmployee) => ({
                url: 'employees',
                method: 'POST',
                body: newEmployee,
            }),
            invalidatesTags: ['Auth'], // Инвалидирует кэш и перерисовывает таблицу
        }),
        // Изменить статус (активен / заблокирован) через чистый JSON RequestBody
        changeEmployeeStatus: builder.mutation<UserProfile, UpdateEmployeeStatusRequest>({
            query: (body) => ({
                url: 'employees/status',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Auth'],
        }),
    }),
});

export const { 
    useGetEmployeesQuery, 
    useCreateEmployeeMutation, 
    useChangeEmployeeStatusMutation 
} = employeesApi;