import { CreateAppForm } from '@/components/developer-dashboard/app/AppForms';

export default function CreateAppPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Create New App</h1>
          <p className="text-gray-600 mt-2">
            Create a new blockchain application and select initial tools
          </p>
        </div>
      </div>

      <CreateAppForm />
    </div>
  );
}
