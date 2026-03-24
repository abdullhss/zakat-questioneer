import { useEffect, useState, type FormEvent } from "react"
import { z } from "zod"
import { executeProcedure , DoTransaction } from "./services/apiServices.js"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ratingOptions = ["سيء", "ضعيف", "جيد", "جيد جداً", "ممتاز"]

type City = {
  Id: number
  CityName: string
}

const arabicFullNameRegex = /^[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){3,}$/
const phoneRegex = /^09\d{8}$/
const ratingToValue: Record<string, number> = {
  سيء: 1,
  ضعيف: 2,
  جيد: 3,
  "جيد جداً": 4,
  ممتاز: 5,
}

const surveySchema = z.object({
  fullName: z.string().trim().optional(),
  role: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  usage: z.string().trim().optional(),
  speed: z.string().trim().optional(),
  clearity: z.string().trim().optional(),
  problems: z.string().trim().optional(),
  suggestions: z.string().trim().optional(),
  reachToWeb: z.string().trim().optional(),
  workshopAttendance: z.enum(["agree", "form-only"]).optional(),
}).superRefine((data, ctx) => {
  const hasAtLeastOneFilledField = [
    data.fullName,
    data.role,
    data.city,
    data.phone,
    data.email,
    data.usage,
    data.speed,
    data.clearity,
    data.problems,
    data.suggestions,
    data.reachToWeb,
  ].some((value) => Boolean(value && String(value).trim()))

  if (!hasAtLeastOneFilledField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fullName"],
      message: "يرجى تعبئة حقل واحد على الأقل قبل الإرسال",
    })
  }

  if (data.workshopAttendance === "agree") {
    if (data.fullName && !arabicFullNameRegex.test(data.fullName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "يجب كتابة اسم عربي رباعي على الأقل",
      })
    }
    if (data.phone && !phoneRegex.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 09",
      })
    }
    if (data.email && !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "يرجى إدخال بريد إلكتروني صحيح",
      })
    }

    if (!data.fullName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "الاسم الرباعي مطلوب",
      })
    }
    if (!data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "الصفة الوظيفية/الاجتماعية مطلوبة",
      })
    }
    if (!data.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "محل الإقامة (المدينة) مطلوب",
      })
    }
    if (!data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "رقم الهاتف مطلوب",
      })
    }
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "البريد الإلكتروني مطلوب",
      })
    }
  }
})

function App() {
  const [errors, setErrors] = useState<{
    fullName?: string
    role?: string
    city?: string
    phone?: string
    email?: string
  }>({})
  const [cities, setCities] = useState<City[]>([])
  const [formValues, setFormValues] = useState({
    fullName: "",
    role: "",
    city: "",
    phone: "",
    email: "",
    usage: "",
    speed: "",
    clearity: "",
    problems: "",
    suggestions: "",
    reachToWeb: "",
    workshopAttendance: undefined as "agree" | "form-only" | undefined,
  })
  const isFormValid = surveySchema.safeParse(formValues).success

  useEffect(() => {
    const getCities = async () => {
      try {
        const response = await executeProcedure(
          "xR3P2FQ9gQI7pvkeyawk7A==",
          "1#1000"
        )
        const decrypted = response.decrypted as { CitiesData?: string } | undefined
        const data = decrypted?.CitiesData
          ? JSON.parse(decrypted.CitiesData)
          : []

        if (Array.isArray(data)) {
          setCities(data)
        } else {
          setCities([])
        }
      } catch (error) {
        console.error("Failed to load cities:", error)
        setCities([])
      }
    }

    getCities()
  }, [])

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget)
    const workshopAttendanceValue = formData.get("workshopAttendance")

    setFormValues({
      fullName: String(formData.get("fullName") ?? ""),
      role: String(formData.get("role") ?? ""),
      city: String(formData.get("city") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      usage: String(formData.get("usage") ?? ""),
      speed: String(formData.get("speed") ?? ""),
      clearity: String(formData.get("clearity") ?? ""),
      problems: String(formData.get("problems") ?? ""),
      suggestions: String(formData.get("suggestions") ?? ""),
      reachToWeb: String(formData.get("reachToWeb") ?? ""),
      workshopAttendance:
        workshopAttendanceValue === "agree" ||
        workshopAttendanceValue === "form-only"
          ? workshopAttendanceValue
          : undefined,
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const workshopAttendanceValue = formData.get("workshopAttendance")
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      role: String(formData.get("role") ?? ""),
      city: String(formData.get("city") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      usage: String(formData.get("usage") ?? ""),
      speed: String(formData.get("speed") ?? ""),
      clearity: String(formData.get("clearity") ?? ""),
      problems: String(formData.get("problems") ?? ""),
      suggestions: String(formData.get("suggestions") ?? ""),
      reachToWeb: String(formData.get("reachToWeb") ?? ""),
      workshopAttendance:
        workshopAttendanceValue === "agree" ||
        workshopAttendanceValue === "form-only"
          ? workshopAttendanceValue
          : undefined,
    }

    const result = surveySchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        fullName: fieldErrors.fullName?.[0],
        role: fieldErrors.role?.[0],
        city: fieldErrors.city?.[0],
        phone: fieldErrors.phone?.[0],
        email: fieldErrors.email?.[0],
      })
      return
    }

    const usageValue = payload.usage ? ratingToValue[payload.usage] ?? "" : ""
    const speedValue = payload.speed ? ratingToValue[payload.speed] ?? "" : ""
    const clearityValue = payload.clearity ? ratingToValue[payload.clearity] ?? "" : ""
    const attendanceValue =
      payload.workshopAttendance === "agree"
        ? 1
        : payload.workshopAttendance === "form-only"
          ? 0
          : ""

    const transactionPayload = `0#${payload.fullName}#${payload.role}#${payload.city}#${payload.phone}#${payload.email}#${usageValue}#${speedValue}#${clearityValue}#${payload.problems}#${payload.suggestions}#${payload.reachToWeb}#${attendanceValue}`

    const response = await DoTransaction(
      "6uvowgE2pDVXNQ6rsnH0Sw==",
      transactionPayload
    )
    console.log(response)
    if (Number(response.success) === 200) {
      toast.success("تم إرسال الاستبيان بنجاح")
    } else {
      toast.error(response.error)
    }

    setErrors({})
    event.currentTarget.reset()
  }

  return (
    <main className="islamic-pattern-bg min-h-screen" dir="rtl">
      <ToastContainer />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
        <div className="form-pattern-bg w-full max-w-4xl rounded-3xl p-6 shadow-2xl sm:p-10">
          <div className="mb-5 flex justify-center">
            <img
              src="/Logo.png"
              alt="شعار منصة وصل"
              className="h-14 w-auto sm:h-16"
            />
          </div>

          <h1 className="themed-title text-center text-2xl font-bold sm:text-3xl">
            استطلاع الرأي والتقييم الفني لمنصة "وصل الليبية" الإلكترونية
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            التابعة لصندوق الزكاة الليبي
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            في إطار حرص صندوق الزكاة الليبي على التحول الرقمي وتطوير الخدمات
            المقدمة للمزكين والمستحقين للمساعدات، نضع بين أيديكم هذا النموذج
            لتقييم منصة "وصل" الليبية. تهدف هذه الاستبانة إلى رصد التحديات
            التقنية والميدانية وتطويرها بما يخدم المصلحة العامة.
          </p>

          <form
            className="mt-8 space-y-8"
            noValidate
            onSubmit={handleSubmit}
            onChange={handleFormChange}
          >
            <section className="space-y-4">
              <h2 className="themed-title text-xl font-semibold">
                القسم الأول: البيانات العامة (اختياري)
              </h2>
              <p className="text-sm text-slate-600">
                يرجى تعبئة البيانات التالية في حال رغبتكم في التواصل معكم
                لاحقاً:
              </p>

              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  الاسم الرباعي
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={`themed-input w-full rounded-xl px-4 py-3 text-sm ${errors.fullName ? "border-red-500" : ""}`}
                  placeholder="أدخل الاسم الرباعي"
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="role"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    الصفة الوظيفية/الاجتماعية
                  </label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    className={`themed-input w-full rounded-xl px-4 py-3 text-sm ${errors.role ? "border-red-500" : ""}`}
                    placeholder="مثال: موظف، باحث اجتماعي"
                  />
                  {errors.role && (
                    <p className="mt-2 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    محل الإقامة (المدينة)
                  </label>
                  <select
                    id="city"
                    name="city"
                    defaultValue=""
                    className={`themed-input w-full rounded-xl px-4 py-3 text-sm ${errors.city ? "border-red-500" : ""}`}
                  >
                    <option value="" disabled>
                      اختر المدينة
                    </option>
                    {cities.map((city) => (
                      <option key={city.Id} value={city.Id}>
                        {city.CityName}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    رقم الهاتف
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={`themed-input w-full rounded-xl px-4 py-3 text-sm ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="09XXXXXXXX"
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`themed-input w-full rounded-xl px-4 py-3 text-sm ${errors.email ? "border-red-500" : ""}`}
                    placeholder="name@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="themed-title text-xl font-semibold">
                القسم الثاني: التقييم الفني للمنصة
              </h2>
              <p className="text-sm text-slate-600">
                يرجى اختيار التقييم المناسب من (سيء - ضعيف - جيد - جيد جداً -
                ممتاز):
              </p>

              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor="uiRating"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    ما تقييمك لسهولة استخدام واجهة المنصة (التصميم وتجربة
                    المستخدم)؟
                  </label>
                  <select
                    id="uiRating"
                    name="usage"
                    defaultValue=""
                    className="themed-input w-full rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="" disabled>
                      اختر التقييم
                    </option>
                    {ratingOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="speedRating"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    ما تقييمك لسرعة تنفيذ العمليات المالية عبر المنصة؟
                  </label>
                  <select
                    id="speedRating"
                    name="speed"
                    defaultValue=""
                    className="themed-input w-full rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="" disabled>
                      اختر التقييم
                    </option>
                    {ratingOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stepsRating"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    ما تقييمك لدرجة الوضوح في خطوات تقديم طلبات الإعانة؟
                  </label>
                  <select
                    id="stepsRating"
                    name="clearity"
                    defaultValue=""
                    className="themed-input w-full rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="" disabled>
                      اختر التقييم
                    </option>
                    {ratingOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="themed-title text-xl font-semibold">
                القسم الثالث: المشاكل والعراقيل (رصد التحديات)
              </h2>
              <label
                htmlFor="issues"
                className="block text-sm font-medium text-slate-700"
              >
                يرجى وصف أي عوائق تقنية (مثل: مشاكل الدفع، الربط المصرفي) أو
                إدارية واجهتكم عند استخدام المنصة:
              </label>
              <textarea
                id="issues"
                name="problems"
                rows={5}
                className="themed-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="اكتب التفاصيل هنا..."
              />
            </section>

            <section className="space-y-4">
              <h2 className="themed-title text-xl font-semibold">
                القسم الرابع: المقترحات والرؤية المستقبلية
              </h2>

              <div>
                <label
                  htmlFor="services"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  الخدمات المضافة: ما هي الميزات أو الخدمات التي تقترح إدراجها
                  في المنصة مستقبلاً؟
                </label>
                <textarea
                  id="services"
                  name="suggestions"
                  rows={4}
                  className="themed-input w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="اكتب مقترحاتك للخدمات الجديدة..."
                />
              </div>

              <div>
                <label
                  htmlFor="access"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  تعزيز الوصول: كيف يمكننا تحسين وصول المنصة للمناطق البعيدة أو
                  الفئات التي لا تجيد استخدام التقنية؟
                </label>
                <textarea
                  id="access"
                  name="reachToWeb"
                  rows={4}
                  className="themed-input w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="اكتب أفكارك لتحسين الوصول..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="themed-title text-xl font-semibold">
                القسم الخامس: المشاركة في ورشة العمل الوطنية
              </h2>
              <p className="text-sm leading-7 text-slate-700">
                تعتزم إدارة الصندوق عقد ورشة عمل موسعة لمناقشة تطوير المنصة
                وإشهارها بحضور نخبة من المسؤولين والأعيان والتقنيين.
              </p>
              <p className="text-sm text-slate-700">
                هل ترغب في حضور ورشة العمل المزمع تنفيذها بعد 20 يوماً من تاريخ
                اليوم؟
              </p>

              <div className="space-y-2 text-sm text-slate-800">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="workshopAttendance"
                    value="agree"
                    className="h-4 w-4"
                  />
                  <span>
                    موافق (سيتم التواصل معكم عبر البيانات أعلاه لتأكيد الحضور).
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="workshopAttendance"
                    value="form-only"
                    className="h-4 w-4"
                  />
                  <span>أكتفي بتعبئة هذا النموذج.</span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-4">
              <h2 className="themed-title text-lg font-semibold">
                خاتمة النموذج
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                "نشكركم على سعة صدركم ومساهمتكم الفاعلة. نؤكد لكم بأن كافة
                ملاحظاتكم ستكون محل اهتمام القيادة العليا بالصندوق، وستشكل
                ركيزة أساسية في جدول أعمال اجتماعنا القادم لتطوير منصة وصل
                الليبية."
              </p>
            </section>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`themed-btn w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity sm:text-base ${
                !isFormValid ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              إرسال الاستبيان
            </button>
            {/* {submitMessage && (
              <p className="text-center text-sm font-medium text-emerald-700">
                {submitMessage}
              </p>
            )} */}
          </form>
        </div>
      </section>
    </main>
  )
}

export default App
