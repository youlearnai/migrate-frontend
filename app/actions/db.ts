"use server";

import { getFirestore, CollectionReference } from "firebase-admin/firestore";

export async function submitMaintenanceNotification(email: string) {
  try {
    const db = getFirestore();
    const maintenanceRef = db.collection(
      "maintenance_notifications_v2",
    ) as CollectionReference;

    const snapshot = await maintenanceRef.where("email", "==", email).get();

    if (snapshot.empty) {
      await maintenanceRef.add({
        email,
        timestamp: new Date(),
      });
      return { success: true, message: "Email added to maintenance list" };
    }

    return { success: true, message: "Email already registered" };
  } catch (error) {
    console.error("Error saving maintenance notification:", error);
    return { success: false, error: "Failed to save notification" };
  }
}
