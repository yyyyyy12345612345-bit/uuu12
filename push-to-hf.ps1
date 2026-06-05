# ===== سكريبت رفع التحديثات على HuggingFace =====
# افتح PowerShell في مجلد المشروع وشغّل: .\push-to-hf.ps1

Set-Location "c:\Users\youse\OneDrive\Desktop\New folder (2)\Quran-main"

Write-Host "=== Remote repositories ===" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Staging all changes ===" -ForegroundColor Cyan
git add -A

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git commit -m "fix: اصلاح شامل لمشاكل الفلاتر والتاثيرات والخط

- اصلاح AnimationType ليدعم 16 حركة بدلا من 6
- اصلاح getFilterCSS لتوحيد قيم الفلاتر في جميع الملفات
- اضافة جميع تاثيرات الاوفرلاي المفقودة في VideoPreview (snow rain fireflies smoke sparkle film_grain light_leak aurora)
- اصلاح textVerticalOffset كان يطبق نصف القيمة في Preview
- اصلاح مشكلة fontWeight قراءته كـ string من localStorage
- اصلاح fontSize كان محدودا بـ 70px في Preview
- اضافة تحكم موقع النص (اعلى وسط اسفل) في Controls
- تحسين عرض ayahDecoration مع preview حقيقي
- توحيد قيم CSS filters بين VideoComposition و VideoPreview و RenderModal"

Write-Host "`n=== Pushing to all remotes ===" -ForegroundColor Cyan
git push --all

Write-Host "`n=== Done! ===" -ForegroundColor Green
