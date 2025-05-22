import { FieldProps } from '@rjsf/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const ExpandableCard = (props: FieldProps) => {
  const { title, idSchema, schema, registry } = props;

  // Use the SchemaField to render the contents
  const { SchemaField } = registry.fields;

  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full mb-4">
      <AccordionItem value="item-1">
        <AccordionTrigger>{title || schema.title || idSchema.$id}</AccordionTrigger>
        <AccordionContent>
          <SchemaField
            {...props}
            uiSchema={{
              ...props.uiSchema,
              'ui:field': undefined, // Remove ui:field to avoid recursion
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
