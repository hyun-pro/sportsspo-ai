'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { userAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.updateProfile(form);
      if (user) setUser({ ...user, name: form.name });
      toast.success('프로필이 업데이트되었습니다.');
    } catch {
      toast.error('업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-gray-500 text-sm mt-1">계정 정보를 관리합니다</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">프로필 정보</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input type="email" className="input-field bg-gray-50" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              type="tel"
              className="input-field"
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-2">구독 정보</h2>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
            {user?.subscription?.plan || 'FREE'}
          </span>
          <span className="text-sm text-gray-500">
            분석 {user?.subscription?.analysisCount || 0} / {(user?.subscription?.maxAnalysis || 5) < 0 ? '무제한' : user?.subscription?.maxAnalysis || 5}회 사용
          </span>
        </div>
      </div>

      <div className="card p-6 border-red-200">
        <h2 className="font-semibold text-red-600 mb-2">위험 영역</h2>
        <p className="text-sm text-gray-500 mb-4">계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
        <button className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
          계정 삭제
        </button>
      </div>
    </div>
  );
}
