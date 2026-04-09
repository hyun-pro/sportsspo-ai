'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Plus, Calendar } from 'lucide-react';
import { reportAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  title: string;
  createdAt: string;
  analysis?: { title: string; address: string };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data } = await reportAPI.list();
      setReports(data.data || []);
    } catch {
      // Demo data
      setReports([
        { id: '1', title: '강남역 상권분석 보고서', createdAt: '2024-03-15', analysis: { title: '강남역 상권분석', address: '서울 강남구 강남대로 396' } },
        { id: '2', title: '홍대입구역 상권분석 보고서', createdAt: '2024-03-10', analysis: { title: '홍대입구역 상권분석', address: '서울 마포구 양화로 160' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('보고서를 삭제하시겠습니까?')) return;
    try {
      await reportAPI.delete(id);
      setReports(reports.filter((r) => r.id !== id));
      toast.success('보고서가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleExportPDF = (report: Report) => {
    toast.success('PDF 다운로드가 시작됩니다.');
    // In production: generate PDF using jspdf + html2canvas
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">보고서</h1>
          <p className="text-gray-500 text-sm mt-1">생성한 분석 보고서를 관리합니다</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">보고서가 없습니다</h3>
          <p className="text-sm text-gray-500 mt-1">상권분석 후 보고서를 생성해보세요</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{report.analysis?.address}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" /> {formatDate(report.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPDF(report)}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
