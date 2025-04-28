import { SelectContent, SelectTrigger, SelectValue, SelectItem, Select } from "@/components/ui/select";

export const LazySelect = ({ initialValue = "string", onUpdate }:
    { initialValue: string, onUpdate: (value: string) => void }) => {
    return (
        <Select
            defaultValue={initialValue}
            onValueChange={onUpdate}
        >
            <SelectTrigger className="text-black">
                <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="string[]">string[]</SelectItem>
                <SelectItem value="bool">bool</SelectItem>
                <SelectItem value="bool[]">bool[]</SelectItem>
                <SelectItem value="uint256">uint256</SelectItem>
                <SelectItem value="uint256[]">uint256[]</SelectItem>
                <SelectItem value="int256">int256</SelectItem>
                <SelectItem value="int256[]">int256[]</SelectItem>
                <SelectItem value="address">address</SelectItem>
                <SelectItem value="address[]">address[]</SelectItem>
                <SelectItem value="bytes">bytes</SelectItem>
                <SelectItem value="bytes[]">bytes[]</SelectItem>
            </SelectContent>
        </Select>
    );
};