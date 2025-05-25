import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Module } from "@/types/module";

interface ModuleCardProps {
    module: Module;
}

export function ModuleCard({ module }: ModuleCardProps) {
    const navigate = useNavigate();

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(`/module/${module.id}`)}>
            <img
                src={module.image_url}
                alt={module.title}
                className="rounded-t-md w-full h-40 object-cover"
            />
            <CardContent className="p-4">
                <h3 className="font-semibold text-base">{module.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                </p>
                <Button variant="link" className="px-0 mt-2 text-green-700">
                    View Course
                </Button>
            </CardContent>
        </Card>
    );
}
