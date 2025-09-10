interface RegisterInput {
    email: string;
    password: string;
    name: string;
    department?: string;
}
interface UpdateUserInput {
    name?: string;
    department?: string;
}
export declare const authResolvers: {
    Query: {
        currentUser: (_: unknown, { token }: {
            token: string;
        }) => Promise<{
            id: string;
            email: string;
            name: string;
            role: string;
            department?: string;
            avatar?: string;
            isActive: boolean;
            createdAt: string;
            lastLoginAt?: string;
        } | null>;
        validateToken: (_: unknown, { token }: {
            token: string;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        } | {
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                department?: string;
                avatar?: string;
                isActive: boolean;
                createdAt: string;
                lastLoginAt?: string;
            };
            token: string;
            message: string;
            success: boolean;
        }>;
    };
    Mutation: {
        login: (_: unknown, { email, password }: {
            email: string;
            password: string;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        } | {
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                department?: string;
                avatar?: string;
                isActive: boolean;
                createdAt: string;
                lastLoginAt?: string;
            };
            token: string;
            message: string;
            success: boolean;
        }>;
        logout: (_: unknown, { token }: {
            token: string;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        }>;
        register: (_: unknown, { input }: {
            input: RegisterInput;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        } | {
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                department?: string;
                avatar?: string;
                isActive: boolean;
                createdAt: string;
                lastLoginAt?: string;
            };
            token: null;
            message: string;
            success: boolean;
        }>;
        requestPasswordReset: (_: unknown, { email }: {
            email: string;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        } | {
            user: null;
            token: string;
            message: string;
            success: boolean;
        }>;
        resetPassword: (_: unknown, { token, newPassword }: {
            token: string;
            newPassword: string;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        }>;
        updateUserProfile: (_: unknown, { token, input }: {
            token: string;
            input: UpdateUserInput;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        } | {
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                department?: string;
                avatar?: string;
                isActive: boolean;
                createdAt: string;
                lastLoginAt?: string;
            };
            token: string;
            message: string;
            success: boolean;
        }>;
        updateUserPassword: (_: unknown, { token, currentPassword, newPassword }: {
            token: string;
            currentPassword: string;
            newPassword: string;
        }) => Promise<{
            user: null;
            token: null;
            message: string;
            success: boolean;
        } | {
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                department?: string;
                avatar?: string;
                isActive: boolean;
                createdAt: string;
                lastLoginAt?: string;
            };
            token: string;
            message: string;
            success: boolean;
        }>;
    };
};
export {};
//# sourceMappingURL=auth.d.ts.map