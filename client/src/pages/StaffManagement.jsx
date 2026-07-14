import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CircleX,
  PauseCircle,
  PlayCircle,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { usePopup } from '../components/context/PopupProvider';
import SelectField from '../components/context/SelectField';
import ModalShell from '../components/context/ModalShell';

const registryGradient =
  'bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.16),transparent_32%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)]';

const StaffManagement = () => {
  const popup = usePopup();
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseModalStaff, setCourseModalStaff] = useState(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [draftCourseIds, setDraftCourseIds] = useState([]);
  const [savingCourses, setSavingCourses] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Instructor',
  });

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/staff/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(res.data.data);
    } catch (err) {
      console.error('Failed to load staff', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses', err);
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchCourses();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Instructor',
    });
  };

  const closeCreateModal = () => {
    if (loading) return;
    setShowCreateModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/staff/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      popup.success('Staff account created successfully.', {
        title: 'Staff Added',
      });
      closeCreateModal();
      fetchStaff();
    } catch (err) {
      popup.error(err.response?.data?.error || 'Error creating account', {
        title: 'Creation Failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    const confirmed = await popup.confirm({
      title: 'Delete Staff Member?',
      message:
        'This will permanently remove the selected staff account from the system.',
      confirmText: 'Delete Staff',
      cancelText: 'Keep Staff',
      kind: 'error',
    });
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaff();
      popup.success('Staff member deleted successfully.', {
        title: 'Staff Removed',
      });
    } catch (err) {
      popup.error('Failed to delete staff', {
        title: 'Delete Failed',
      });
    }
  };

  const handleToggleStaffStatus = async (person) => {
    const nextStatus = (person.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    const actionText = nextStatus === 'Active' ? 'activate' : 'deactivate';

    const confirmed = await popup.confirm({
      title: `${nextStatus === 'Active' ? 'Activate' : 'Deactivate'} Staff Member?`,
      message: `This will ${actionText} ${person.full_name}'s staff access.`,
      confirmText: nextStatus === 'Active' ? 'Activate Staff' : 'Deactivate Staff',
      cancelText: 'Cancel',
      kind: nextStatus === 'Active' ? 'success' : 'warning',
    });
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/staff/${person.id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchStaff();
      popup.success(`${person.full_name} is now ${nextStatus.toLowerCase()}.`, {
        title: 'Status Updated',
      });
    } catch (err) {
      popup.error(err.response?.data?.error || 'Failed to update staff status', {
        title: 'Update Failed',
      });
    }
  };

  const handleSaveCourses = async () => {
    if (!courseModalStaff) return;
    setSavingCourses(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/staff/assign-course',
        { staffId: courseModalStaff.id, courseIds: draftCourseIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStaff();
      setCourseModalStaff(null);
      setCourseSearch('');
      popup.success('Assigned courses updated successfully.', {
        title: 'Courses Updated',
      });
    } catch (err) {
      popup.error('Failed to update courses', {
        title: 'Update Failed',
      });
    } finally {
      setSavingCourses(false);
    }
  };

  const totalManagers = staff.filter((member) => member.role === 'Manager').length;
  const totalAdmins = staff.filter((member) => member.role === 'Admin').length;
  const totalInstructors = staff.filter(
    (member) => member.role === 'Instructor'
  ).length;

  const getInitials = (fullName = '') =>
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ST';

  const getRoleTone = (role) => {
    if (role === 'Manager') return 'bg-[#2B2A4C] text-white';
    if (role === 'Admin') return 'bg-amber-100 text-amber-700';
    return 'bg-[#DDF1FB] text-[#187EB4]';
  };

  const getStatusTone = (status = 'Active') => {
    if (status === 'On Leave') {
      return 'text-amber-600 bg-amber-500';
    }
    if (status === 'Inactive') {
      return 'text-slate-500 bg-slate-400';
    }
    return 'text-emerald-600 bg-emerald-500';
  };

  const getAssignedCourseTitles = (person) => {
    const assignedIds = Array.isArray(person.assigned_course_id)
      ? person.assigned_course_id
      : [];
    return assignedIds
      .map((assignedId) =>
        courses.find((course) => String(course.id) === String(assignedId))
      )
      .filter(Boolean)
      .map((course) => course.title || course.course_name);
  };

  const openCourseManager = (person) => {
    setCourseModalStaff(person);
    setCourseSearch('');
    setDraftCourseIds(
      Array.isArray(person.assigned_course_id) ? person.assigned_course_id : []
    );
  };

  const closeCourseManager = () => {
    if (savingCourses) return;
    setCourseModalStaff(null);
    setCourseSearch('');
    setDraftCourseIds([]);
  };

  const toggleDraftCourse = (courseId) => {
    setDraftCourseIds((current) =>
      current.some((id) => String(id) === String(courseId))
        ? current.filter((id) => String(id) !== String(courseId))
        : [...current, courseId]
    );
  };

  const draftCourses = draftCourseIds
    .map((assignedId) =>
      courses.find((course) => String(course.id) === String(assignedId))
    )
    .filter(Boolean);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        if (!courseSearch.trim()) return true;
        const title = course.title || course.course_name || '';
        return title
          .toLowerCase()
          .includes(courseSearch.trim().toLowerCase());
      }),
    [courseSearch, courses]
  );

  const stats = [
    {
      label: 'Total Staff',
      value: staff.length,
      icon: Users,
      iconTone: 'bg-[#EDF9F4] text-[#1D8F62]',
    },
    {
      label: 'Total Managers',
      value: totalManagers,
      icon: ShieldCheck,
      iconTone: 'bg-[#EEF4FF] text-[#2B2A4C]',
    },
    {
      label: 'Total Admins',
      value: totalAdmins,
      icon: Users,
      iconTone: 'bg-[#FFF5E8] text-[#C77817]',
    },
    {
      label: 'Total Instructors',
      value: totalInstructors,
      icon: GraduationCap,
      iconTone: 'bg-[#E7F8FF] text-[#2095D3]',
    },
  ];

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(staff.length / pageSize));
  const paginatedStaff = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return staff.slice(startIndex, startIndex + pageSize);
  }, [page, staff]);
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const pageStart = staff.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, staff.length);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className={`w-full ${registryGradient} rounded-[36px] p-4 sm:p-6 lg:p-8`}>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">
              Staff Registry
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">
              Manage Staff Accounts
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Create and manage ATO personnel accounts and assign courses to instructors.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-3 self-start rounded-[22px] bg-[#2B2A4C] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(43,42,76,0.22)] transition hover:bg-[#1a1930] active:scale-[0.98]"
          >
            <UserPlus size={18} />
            Create Personnel Account
          </button>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="rounded-[28px] border border-sky-100/80 bg-white p-6 shadow-[0_20px_40px_rgba(24,56,88,0.06)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#45A1D6]">
                  {stat.label}
                </p>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <p className="text-4xl font-black tracking-tight text-[#2B2A4C]">
                    {String(stat.value).padStart(2, '0')}
                  </p>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.iconTone}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="overflow-hidden rounded-[32px] border border-sky-100/90 bg-white shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">
                    Personnel
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">
                    Role
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">
                    Assigned Courses
                  </th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">
                    Status
                  </th>
                  <th className="px-8 py-5 text-right text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {paginatedStaff.map((person) => {
                  const courseTitles = getAssignedCourseTitles(person);
                  const statusText = person.status || 'Active';
                  const statusTone = getStatusTone(statusText);
                  const isInactive = statusText === 'Inactive';

                  return (
                    <tr
                      key={person.id}
                      className="group transition-colors hover:bg-sky-50/40"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#99D2F2] text-lg font-bold text-[#2B2A4C]">
                            {getInitials(person.full_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2B2A4C]">
                              {person.full_name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail size={13} className="text-sky-600" />
                              {person.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${getRoleTone(person.role)}`}
                        >
                          {person.role}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {person.role === 'Instructor' ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {courseTitles.length > 0 ? (
                                <>
                                  {courseTitles.slice(0, 2).map((courseTitle) => (
                                    <span
                                      key={`${person.id}-${courseTitle}`}
                                      className="inline-flex rounded-lg border border-[#99D2F2] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#2095D3]"
                                    >
                                      {courseTitle}
                                    </span>
                                  ))}
                                  {courseTitles.length > 2 && (
                                    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                      +{courseTitles.length - 2} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] italic text-slate-400">
                                  No courses assigned
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => openCourseManager(person)}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-semibold text-[#2095D3] transition hover:border-sky-200 hover:bg-sky-50"
                            >
                              <BookOpenCheck size={14} />
                              Manage Courses
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-slate-400">
                            Operational administration
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div
                          className={`inline-flex items-center gap-2 text-sm font-medium ${statusTone.split(' ')[0]}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${statusTone.split(' ')[1]}`}
                          />
                          {statusText}
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStaffStatus(person)}
                            className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                              isInactive
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100'
                                : 'border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100'
                            }`}
                            title={isInactive ? 'Activate staff member' : 'Deactivate staff member'}
                          >
                            {isInactive ? <PlayCircle size={17} /> : <PauseCircle size={17} />}
                            {isInactive ? 'Activate' : 'Deactivate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(person.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Delete staff member"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {staff.length === 0 && (
            <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                <Users size={28} />
              </div>
              <p className="mt-6 text-xl font-bold text-slate-900">
                No staff members yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
                Create the first personnel account from the top-right button to
                start building your academy team.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-sky-100 bg-slate-50/60 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {pageStart} to {pageEnd} of {staff.length} staff members
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    page === pageNumber
                      ? 'border border-sky-100 bg-white font-bold text-sky-600 shadow-sm'
                      : 'border border-transparent text-slate-600 hover:border-sky-100 hover:bg-white'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <ModalShell
        open={showCreateModal}
        onClose={closeCreateModal}
        title="Add New Staff Member"
        subtitle="Register a new instructor, manager, or admin for the academy."
        maxWidth="max-w-[520px]"
        bodyClassName="overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-8 p-8 sm:p-10">
          <div className="relative">
            <input
              id="staff-full-name"
              type="text"
              required
              placeholder=" "
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="peer w-full border-x-0 border-b border-t-0 border-sky-200 bg-transparent px-0 pb-2 pt-5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-0"
            />
            <label
              htmlFor="staff-full-name"
              className="pointer-events-none absolute left-0 top-4 text-sm font-semibold text-sky-400 transition-all duration-200 peer-placeholder-shown:top-4 peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-[0.2em] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.2em]"
            >
              Full Name
            </label>
          </div>

          <div className="relative">
            <input
              id="staff-email"
              type="email"
              required
              placeholder=" "
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="peer w-full border-x-0 border-b border-t-0 border-sky-200 bg-transparent px-0 pb-2 pt-5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-0"
            />
            <label
              htmlFor="staff-email"
              className="pointer-events-none absolute left-0 top-4 text-sm font-semibold text-sky-400 transition-all duration-200 peer-placeholder-shown:top-4 peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-[0.2em] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.2em]"
            >
              Email Address
            </label>
          </div>

          <div className="relative">
            <input
              id="staff-password"
              type="password"
              required
              placeholder=" "
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="peer w-full border-x-0 border-b border-t-0 border-sky-200 bg-transparent px-0 pb-2 pt-5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-0"
            />
            <label
              htmlFor="staff-password"
              className="pointer-events-none absolute left-0 top-4 text-sm font-semibold text-sky-400 transition-all duration-200 peer-placeholder-shown:top-4 peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-[0.2em] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.2em]"
            >
              Access Password
            </label>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
              Role
            </label>
            <SelectField
              id="staff-role"
              name="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              placeholder="Select a staff role"
            >
              <option value="Instructor"> Instructor</option>
              <option value="Admin">Administrative Staff</option>
              <option value="Manager">Accountable Manager</option>
            </SelectField>
          </div>

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#2095D3] px-6 py-4 text-lg font-bold text-white shadow-[0_18px_40px_rgba(32,149,211,0.22)] transition hover:bg-[#1A7BB1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            <button
              type="button"
              onClick={closeCreateModal}
              className="w-full py-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={!!courseModalStaff}
        onClose={closeCourseManager}
        title="Course Manager"
        subtitle={
          courseModalStaff
            ? `${courseModalStaff.full_name} · Personnel Assignment System`
            : ''
        }
        maxWidth="max-w-5xl"
        contentClassName="h-[90vh] max-h-[90vh]"
        bodyClassName="overflow-y-auto lg:overflow-hidden"
      >
        {courseModalStaff && (
          <div className="flex min-h-full flex-col lg:h-full lg:min-h-0 lg:flex-1 lg:flex-row">
            <div className="flex min-h-[420px] flex-col border-b border-sky-100 bg-white lg:min-h-0 lg:flex-1 lg:border-b-0 lg:border-r">
              <div className="p-6">
                <div className="group relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#2095D3]"
                  />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search aviation courses..."
                    className="w-full border-x-0 border-b border-t-0 border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2095D3] focus:ring-0"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Available Modules
                </span>
                <div className="space-y-3">
                  {filteredCourses.map((course) => {
                    const title = course.title || course.course_name;
                    const checked = draftCourseIds.some(
                      (id) => String(id) === String(course.id)
                    );

                    return (
                      <label
                        key={course.id}
                        className={`group flex cursor-pointer items-center gap-4 rounded-[22px] border p-4 transition ${
                          checked
                            ? 'border-[#99D2F2] bg-sky-50'
                            : 'border-transparent hover:border-sky-100 hover:bg-sky-50/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDraftCourse(course.id)}
                          className="h-5 w-5 rounded border-slate-300 text-[#2095D3] focus:ring-[#2095D3]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{title}</p>
                        </div>
                        <ChevronRightShim />
                      </label>
                    );
                  })}

                  {filteredCourses.length === 0 && (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
                      No matching courses found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-h-[320px] w-full flex-col bg-slate-50/70 p-6 lg:min-h-0 lg:w-[380px] lg:p-8">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900">Selected Courses</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Review the curriculum assignments for this instructor.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {draftCourses.map((course) => (
                    <button
                      key={`selected-${course.id}`}
                      type="button"
                      onClick={() => toggleDraftCourse(course.id)}
                      className="flex w-full items-start justify-between gap-4 rounded-[22px] border border-[#CDEAF9] bg-white px-4 py-4 text-left transition hover:border-red-200 hover:bg-red-50/40"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {course.title || course.course_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Assigned to this instructor for delivery and coordination.
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 text-slate-400 transition hover:text-red-500">
                        <CircleX size={16} />
                      </span>
                    </button>
                  ))}
                </div>

                {draftCourses.length === 0 && (
                  <div className="mt-10 rounded-[24px] border border-dashed border-slate-200 bg-white/60 px-5 py-10 text-center text-sm text-slate-400">
                    No courses selected yet.
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-sky-100 bg-slate-50/70 pt-4 lg:sticky lg:bottom-0">
                <button
                  type="button"
                  onClick={handleSaveCourses}
                  disabled={savingCourses}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2095D3] px-6 py-4 font-semibold text-white shadow-[0_18px_40px_rgba(32,149,211,0.2)] transition hover:bg-[#1A7BB1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingCourses ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Assignments'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
};

const ChevronRightShim = () => (
  <ChevronRight
    size={18}
    className="text-slate-300 transition-colors group-hover:text-[#2095D3]"
  />
);

export default StaffManagement;
