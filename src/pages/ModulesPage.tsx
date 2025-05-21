import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";
import type { Module } from "@/types/module";
import { ModuleCard } from "@/components/ModuleCard";
import { CreateModule } from "@/components/CreateModule";
import { getCurrUserRole } from "@/handlers/auth";

export default function ModulesPage() {
    const [modules, setModules] = useState<Module[]>([]);
    const [role, setRole] = useState<string>("");

    useEffect(() => {
        async function fetchRole() {
            const r = await getCurrUserRole();
            setRole(r);
        }
        fetchRole();
        async function fetchModules() {
            const querySnapshot = await getDocs(collection(db, "modules"));
            const moduleData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Module[];
            setModules(moduleData);
        }

        fetchRole();
        fetchModules();
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold text-green-700 mb-6">
                    Module
                </h2>
                {role === "expert" && <CreateModule />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => (
                    <ModuleCard key={mod.id} module={mod} />
                ))}
            </div>
        </div>
    );
}
