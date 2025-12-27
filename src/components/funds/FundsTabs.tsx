'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  overview: React.ReactNode
  monthly: React.ReactNode
  penalties: React.ReactNode
}

export function FundsTabs({ overview, monthly, penalties }: Props) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="monthly">Quỹ hàng tháng</TabsTrigger>
        <TabsTrigger value="penalties">Tiền phạt</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        {overview}
      </TabsContent>
      <TabsContent value="monthly" className="space-y-4">
        {monthly}
      </TabsContent>
      <TabsContent value="penalties" className="space-y-4">
        {penalties}
      </TabsContent>
    </Tabs>
  )
}
