import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, CreditCard, Calendar, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RevenueData {
  course_id: string;
  course_title: string;
  total_students: number;
  paid_students: number;
  total_revenue: number;
  instructor_revenue: number;
  average_rating: number;
  rating_count: number;
}

interface PayoutData {
  id: string;
  course_title: string;
  amount: number;
  instructor_revenue: number;
  platform_fee: number;
  purchased_at: string;
  payout_processed: boolean;
  payout_date: string | null;
}

const RevenueTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [payoutData, setPayoutData] = useState<PayoutData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    pendingPayouts: 0,
    processedPayouts: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
    fetchPayoutData();
  }, [user]);

  const fetchRevenueData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('instructor_analytics')
        .select('*')
        .eq('instructor_id', user.id);

      if (error) throw error;

      setRevenueData(data || []);

      // Calculate total stats
      const stats = (data || []).reduce((acc, course) => ({
        totalRevenue: acc.totalRevenue + (course.instructor_revenue || 0),
        totalStudents: acc.totalStudents + (course.total_students || 0),
        pendingPayouts: acc.pendingPayouts,
        processedPayouts: acc.processedPayouts
      }), { totalRevenue: 0, totalStudents: 0, pendingPayouts: 0, processedPayouts: 0 });

      setTotalStats(prev => ({ ...prev, ...stats }));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load revenue data',
        variant: 'destructive'
      });
    }
  };

  const fetchPayoutData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_purchases')
        .select(`
          id,
          amount,
          instructor_revenue,
          platform_fee,
          purchased_at,
          payout_processed,
          payout_date,
          courses!course_purchases_course_id_fkey(title)
        `)
        .eq('payment_status', 'completed')
        .in('course_id', revenueData.map(r => r.course_id))
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedPayouts: PayoutData[] = (data || []).map(p => ({
        id: p.id,
        course_title: p.courses?.title || 'Unknown Course',
        amount: p.amount || 0,
        instructor_revenue: p.instructor_revenue || 0,
        platform_fee: p.platform_fee || 0,
        purchased_at: p.purchased_at,
        payout_processed: p.payout_processed || false,
        payout_date: p.payout_date
      }));

      setPayoutData(formattedPayouts);

      // Calculate payout stats
      const payoutStats = formattedPayouts.reduce((acc, payout) => ({
        pendingPayouts: acc.pendingPayouts + (payout.payout_processed ? 0 : payout.instructor_revenue),
        processedPayouts: acc.processedPayouts + (payout.payout_processed ? payout.instructor_revenue : 0)
      }), { pendingPayouts: 0, processedPayouts: 0 });

      setTotalStats(prev => ({ ...prev, ...payoutStats }));
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    // This would typically integrate with a payment processor
    toast({
      title: 'Payout Requested',
      description: 'Your payout request has been submitted and will be processed within 3-5 business days.',
    });
  };

  const exportRevenueReport = () => {
    const csvContent = [
      ['Course', 'Students', 'Revenue', 'Rating', 'Date'].join(','),
      ...payoutData.map(p => [
        p.course_title,
        '1', // Each purchase is one student
        p.instructor_revenue.toFixed(2),
        '', // Rating would need to be joined
        new Date(p.purchased_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading revenue data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revenue Tracking</h2>
        <div className="flex gap-2">
          <Button onClick={exportRevenueReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={requestPayout} disabled={totalStats.pendingPayouts === 0}>
            <CreditCard className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${totalStats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold">${totalStats.pendingPayouts.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Out</p>
                <p className="text-2xl font-bold">${totalStats.processedPayouts.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{totalStats.totalStudents}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Course</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue data yet</h3>
              <p className="text-gray-500">
                Revenue information will appear here once students start purchasing your courses.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {revenueData.map((course) => (
                <Card key={course.course_id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{course.course_title}</h3>
                        <p className="text-sm text-gray-600">
                          {course.paid_students} paid students • {course.total_students} total students
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${(course.instructor_revenue || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          from ${(course.total_revenue || 0).toFixed(2)} total
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        {course.average_rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{course.average_rating.toFixed(1)}</span>
                            <span className="text-gray-500">({course.rating_count} reviews)</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">
                        {((course.instructor_revenue / course.total_revenue) * 100).toFixed(0)}% instructor share
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">
                Transaction history will appear here once students start purchasing your courses.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payoutData.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.course_title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.purchased_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${transaction.instructor_revenue.toFixed(2)}</p>
                    <Badge variant={transaction.payout_processed ? "default" : "secondary"}>
                      {transaction.payout_processed ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueTracker;