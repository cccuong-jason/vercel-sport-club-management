'use client'

import { useFormStatus } from 'react-dom'

interface RemoveMemberButtonProps {
  memberName: string
  removeAction: () => Promise<void>
}

export default function RemoveMemberButton({ memberName, removeAction }: RemoveMemberButtonProps) {
  return (
    <form action={removeAction}>
      <SubmitButton memberName={memberName} />
    </form>
  )
}

function SubmitButton({ memberName }: { memberName: string }) {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit"
      disabled={pending}
      className="rounded-md px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
      onClick={(e) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
          e.preventDefault()
        }
      }}
    >
      {pending ? 'Removing...' : 'Remove'}
    </button>
  )
}
