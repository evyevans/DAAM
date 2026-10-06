import Workspace from '@/components/showcase/Workspace'

// Type-only compatibility for the original fleet components.
export type ActiveView = 'command' | 'fleet' | 'activity' | 'tools' | 'templates' | 'settings'

export default function Page() { return <Workspace /> }
