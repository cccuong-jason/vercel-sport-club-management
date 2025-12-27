import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

interface RecentSalesProps {
  transactions: any[]
}

export function RecentSales({ transactions }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {transactions.length === 0 && <div className="text-sm text-muted-foreground">Không có giao dịch gần đây</div>}
      {transactions.map((t) => (
        <div key={t._id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/01.png" alt="Avatar" />
            <AvatarFallback>{t.memberId?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{t.memberId?.name || 'Không rõ'}</p>
            <p className="text-sm text-muted-foreground">
              {t.memberId?.email || 'Không có email'}
            </p>
          </div>
          <div className={`ml-auto font-medium ${t.type === 'contribution' ? 'text-green-600' : 'text-red-600'}`}>
            {t.type === 'contribution' ? '+' : '-'}${t.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}
