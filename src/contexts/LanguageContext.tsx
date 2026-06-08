"use client";
import { createContext, useContext, useState } from "react";

type Lang = "en" | "ar";
interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }

const translations: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    newRequest: "New Request",
    bulkUpload: "Bulk Upload",
    myRequests: "My Requests",
    events: "Events",
    notifications: "Notifications",
    allRequests: "All Requests",
    reviewQueue: "Review Queue",
    invitations: "Invitations",
    users: "Users",
    settings: "Settings",
    myAccreditation: "My Accreditation",
    qrPass: "QR Pass",
    requestor: "Requestor",
    admin: "Admin",
    accreditedUser: "Accredited User",
    howItWorks: "How it Works",
    signIn: "Sign In",
    activateAccount: "Activate Account",
    submitRequest: "Submit Request",
    saveDraft: "Save Draft",
    approve: "Approve",
    reject: "Reject",
    requestInfo: "Request Info",
    back: "Back",
    viewAll: "View All",
    export: "Export",
    search: "Search",
  },
  ar: {
    dashboard: "لوحة التحكم",
    newRequest: "طلب جديد",
    bulkUpload: "رفع جماعي",
    myRequests: "طلباتي",
    events: "الفعاليات",
    notifications: "الإشعارات",
    allRequests: "جميع الطلبات",
    reviewQueue: "قائمة المراجعة",
    invitations: "الدعوات",
    users: "المستخدمون",
    settings: "الإعدادات",
    myAccreditation: "اعتمادي",
    qrPass: "تصريح QR",
    requestor: "مقدم الطلب",
    admin: "المشرف",
    accreditedUser: "مستخدم معتمد",
    howItWorks: "كيف يعمل",
    signIn: "تسجيل الدخول",
    activateAccount: "تفعيل الحساب",
    submitRequest: "إرسال الطلب",
    saveDraft: "حفظ المسودة",
    approve: "موافقة",
    reject: "رفض",
    requestInfo: "طلب معلومات",
    back: "رجوع",
    viewAll: "عرض الكل",
    export: "تصدير",
    search: "بحث",
  },
};

const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {}, t: k => k });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  const t = (key: string) => translations[lang][key] ?? key;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
