export enum UserRoles {
    Base = "מורה",
    Admin = "מנהל",
    SuperAdmin = "בכיר",
    Support = "תמיכה"
}

export const getRoleKey = (role?: UserRoles): keyof UserRoles | undefined => {
    const roleKey = Object.entries(UserRoles).find(([,value]) => value === role)?.[0] as (keyof UserRoles);

    return roleKey;
}

const getRoleLevel = (role: UserRoles): number => {
    return Object.values(UserRoles).indexOf(role);
} 

export const hasPermiisions = (role: UserRoles, requiredRole: UserRoles): boolean => {
    return getRoleLevel(role) >= getRoleLevel(requiredRole);
}