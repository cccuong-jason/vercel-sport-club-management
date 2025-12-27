'use client'

import { submitVote } from '@/app/(main)/voting/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from 'react'
import { Medal } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  matchId: string
  members: any[]
  voterId: string
}

const REASON_OPTIONS = [
  "Phòng ngự chắc chắn (cản phá, cắt bóng, phá bóng giải nguy, tranh chấp tay đôi) | Hậu vệ",
  "Cứu thua xuất sắc | Thủ môn",
  "Tinh thần thi đấu xuất sắc, truyền cảm hứng cho đội",
  "Sáng tạo và kỹ thuật (Qua người, rê dắt thành công, tạo đột biến)",
  "Đam mê kiến tạo (Tạo ra nhiều cơ hội thành bàn, kiến tạo thành bàn)",
  "Nòng súng chủ lực (Ghi nhiều bàn thắng giúp đội chiến thắng)"
]

interface SectionState {
  playerId: string
  reasons: string[]
  otherReason: string
}

export function VotingForm({ matchId, members, voterId }: Props) {
  const eligible = members.filter(m => String(m._id) !== voterId && m.status === 'active')
  
  const [votes, setVotes] = useState<{
    first: SectionState,
    second: SectionState,
    third: SectionState
  }>({
    first: { playerId: '', reasons: [], otherReason: '' },
    second: { playerId: '', reasons: [], otherReason: '' },
    third: { playerId: '', reasons: [], otherReason: '' }
  })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const updateVote = (rank: 'first'|'second'|'third', field: keyof SectionState, value: any) => {
    setVotes(prev => ({
      ...prev,
      [rank]: { ...prev[rank], [field]: value }
    }))
  }

  const toggleReason = (rank: 'first'|'second'|'third', reason: string) => {
    setVotes(prev => {
      const currentReasons = prev[rank].reasons
      const newReasons = currentReasons.includes(reason)
        ? currentReasons.filter(r => r !== reason)
        : [...currentReasons, reason]
      return { ...prev, [rank]: { ...prev[rank], reasons: newReasons } }
    })
  }

  const handleSubmit = async (formData: FormData) => {
    // Validate that all 3 players are selected
    if (!votes.first.playerId || !votes.second.playerId || !votes.third.playerId) {
      toast.error('Please select a player for all 3 ranks')
      return
    }

    // Client-side validation for unique selections
    if (
      votes.first.playerId === votes.second.playerId ||
      votes.first.playerId === votes.third.playerId ||
      votes.second.playerId === votes.third.playerId
    ) {
      toast.error('You must select different players for each rank')
      setIsConfirmOpen(false)
      return
    }

    // Manually construct FormData since we're using complex state
    const data = new FormData()
    
    data.append('first', votes.first.playerId)
    data.append('firstReasons', JSON.stringify(votes.first.reasons))
    data.append('firstOtherReason', votes.first.otherReason)

    data.append('second', votes.second.playerId)
    data.append('secondReasons', JSON.stringify(votes.second.reasons))
    data.append('secondOtherReason', votes.second.otherReason)

    data.append('third', votes.third.playerId)
    data.append('thirdReasons', JSON.stringify(votes.third.reasons))
    data.append('thirdOtherReason', votes.third.otherReason)

    const result = await submitVote(matchId, data)
    if (result?.success) {
      toast.success(result.message)
      setIsConfirmOpen(false)
    } else {
      toast.error(result?.message || 'Failed to submit vote')
      setIsConfirmOpen(false)
    }
  }

  // Get list of already selected players (excluding current section's selection)
  const getDisabledPlayers = (currentRank: 'first'|'second'|'third') => {
    const selected = []
    if (currentRank !== 'first' && votes.first.playerId) selected.push(votes.first.playerId)
    if (currentRank !== 'second' && votes.second.playerId) selected.push(votes.second.playerId)
    if (currentRank !== 'third' && votes.third.playerId) selected.push(votes.third.playerId)
    return selected
  }

  const renderSection = (rank: 'first'|'second'|'third', title: string, points: number, colorClass: string) => {
    const state = votes[rank]
    const disabledPlayers = getDisabledPlayers(rank)

    return (
      <div className="border rounded-lg p-6 space-y-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Medal className={`h-5 w-5 ${colorClass}`} />
          <h3 className="font-semibold text-lg">{title} <span className="text-sm font-normal text-muted-foreground">({points} points)</span></h3>
        </div>
        
        <div className="space-y-2">
          <Label>Chọn cầu thủ *</Label>
          <Select 
            value={state.playerId} 
            onValueChange={(val) => updateVote(rank, 'playerId', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player..." />
            </SelectTrigger>
            <SelectContent>
              {eligible.map((m) => (
                <SelectItem 
                  key={m._id} 
                  value={String(m._id)}
                  disabled={disabledPlayers.includes(String(m._id))}
                  className={disabledPlayers.includes(String(m._id)) ? 'opacity-50' : ''}
                >
                  {m.name} {disabledPlayers.includes(String(m._id)) ? '(Selected)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-base">Lý do bạn chọn cầu thủ này cho {title}? *</Label>
          <div className="space-y-2">
            {REASON_OPTIONS.map((reason) => (
              <div key={reason} className="flex items-start space-x-2">
                <Checkbox 
                  id={`${rank}-${reason}`}
                  checked={state.reasons.includes(reason)}
                  onCheckedChange={() => toggleReason(rank, reason)}
                />
                <Label htmlFor={`${rank}-${reason}`} className="text-sm font-normal cursor-pointer leading-snug">
                  {reason}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox 
                id={`${rank}-other`}
                checked={!!state.otherReason}
                onCheckedChange={(checked) => {
                  if (!checked) updateVote(rank, 'otherReason', '')
                }}
              />
              <Label htmlFor={`${rank}-other`} className="text-sm font-normal whitespace-nowrap">Mục khác:</Label>
              <Input 
                className="h-8 border-0 border-b rounded-none focus-visible:ring-0 px-0"
                placeholder="Nhập lý do khác..."
                value={state.otherReason}
                onChange={(e) => updateVote(rank, 'otherReason', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bình chọn MVP</CardTitle>
        <CardDescription>
          Vui lòng bình chọn cho 3 cầu thủ xuất sắc nhất trận đấu.
          <br/>
          Lưu ý: Bạn không thể tự bầu chọn cho chính mình và mỗi cầu thủ chỉ được chọn cho một hạng mục.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-8">
          {renderSection('first', 'MVP Hạng 1', 3, 'text-yellow-500')}
          {renderSection('second', 'MVP Hạng 2', 2, 'text-gray-400')}
          {renderSection('third', 'MVP Hạng 3', 1, 'text-orange-600')}

          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="w-full text-lg py-6">Gửi Bình Chọn</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận bình chọn</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn gửi bình chọn này không? Bạn sẽ không thể thay đổi sau khi gửi.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Hủy</Button>
                <Button onClick={() => handleSubmit(new FormData())}>Xác nhận & Gửi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </CardContent>
    </Card>
  )
}
