import { Input } from "@/components/ui/input";
import { useRef } from "react";

export const LazyInput = ({ initialValue = "", onUpdate, placeholder }:
    { initialValue: string, onUpdate: (value: string) => void, placeholder?: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Using onBlur is much better for performance than onChange 
    const handleBlur = () => {
        if (inputRef.current) {
            onUpdate(inputRef.current.value);
        }
    };

    return (
        <Input
            ref={inputRef}
            placeholder={placeholder}
            defaultValue={initialValue}
            onBlur={handleBlur}
        />
    );
};