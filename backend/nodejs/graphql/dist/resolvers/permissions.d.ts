interface Permission {
    id: string;
    role: string;
    name: string;
    description: string;
    allowedPages: string[];
    deniedPages: string[];
    permissions: {
        canView: string[];
        canEdit: string[];
        canDelete: string[];
        canAdmin: string[];
    };
}
interface PermissionInput {
    allowedPages: string[];
    deniedPages: string[];
    permissions: {
        canView: string[];
        canEdit: string[];
        canDelete: string[];
        canAdmin: string[];
    };
}
export declare const permissionsResolvers: {
    Query: {
        permissions: () => Promise<Permission[]>;
        permissionByRole: (_: unknown, { role }: {
            role: string;
        }) => Promise<Permission | null>;
        checkPageAccess: (_: unknown, { path, token }: {
            path: string;
            token?: string;
        }) => Promise<{
            hasAccess: boolean;
            role: string;
            message: string;
            redirectTo: string | null;
        }>;
        getUserPermissions: (_: unknown, { token }: {
            token?: string;
        }) => Promise<Permission | null>;
    };
    Mutation: {
        updateRolePermissions: (_: unknown, { role, input }: {
            role: string;
            input: PermissionInput;
        }) => Promise<Permission>;
    };
};
export {};
//# sourceMappingURL=permissions.d.ts.map