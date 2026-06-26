"use server"

import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function toggleRole() {
    const user = { id: "1", role: "admin" }

    const [updatedUser] = await db
        .update(UserTable)
        .set({ role: user.role === "admin" ? "user" : "admin" })
        .where(eq(UserTable.id, user.id))
        .returning({ id: UserTable.id, role: UserTable.role });
}