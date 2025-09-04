#!/bin/bash
# Summary of errors script for ESLint

cd /Users/mjoyner/Property/frontend

echo "====== ESLint Error Summary ======"

# Count errors by type
echo "---- Counting 'useTheme' not defined errors ----"
grep -r "useTheme' is not defined" src --include="*.jsx" --include="*.js" | wc -l

echo "---- Counting 'theme' is not defined errors ----"
grep -r "theme' is not defined" src --include="*.jsx" --include="*.js" | wc -l

echo "---- Counting 'useParams' is not defined errors ----"
grep -r "useParams' is not defined" src --include="*.jsx" --include="*.js" | wc -l

echo "---- Counting 'error' is not defined errors ----"
grep -r "error' is not defined" src --include="*.jsx" --include="*.js" | wc -l

echo "---- Counting 'useEffect' is not defined errors ----"
grep -r "useEffect' is not defined" src --include="*.jsx" --include="*.js" | wc -l

echo "===== Files fixed so far ====="
echo "1. Chart.jsx - theme usage"
echo "2. ErrorBoundary.jsx - HomeIcon"
echo "3. EnhancedErrorBoundary.jsx - HomeIcon, BugReportIcon"
echo "4. MaintenanceRequestCard.jsx - HomeIcon, _images"
echo "5. PropertyCard.jsx - HomeIcon, _Avatar"
echo "6. Login.jsx - HomeIcon, _Paper, _error"
echo "7. Properties.jsx - HomeIcon, FilterListIcon, _IconButton"
echo "8. Maintenance.jsx - FilterListIcon, _STATUS_TABS"
echo "9. DataTable.jsx - Removed FilterListIcon import, _IconButton"
echo "10. ResendVerification.jsx - _error"
echo "11. NotificationDetail.jsx - useParams"
echo "12. PaymentDetail.jsx - useParams"
echo "13. PropertyForm.jsx - useParams"
echo "14. TenantForm.jsx - useParams"
echo "15. ChartCard.jsx - theme usage with useTheme()"
echo "16. StatsCard.jsx - theme usage with useTheme()"
echo "17. Toast.jsx - theme usage with useTheme()"
echo "18. PageHeader.jsx - theme usage with useTheme()" 
echo "19. NavBar.jsx - theme usage with useTheme()"
echo "20. MaintenanceContext.jsx - removed duplicate error state"
echo "21. NotificationContext.jsx - removed duplicate error state"
echo "22. PaymentContext.jsx - removed duplicate error state"
echo "23. TenantContext.jsx - removed duplicate error state"
echo "24. PropertyContext.jsx - removed duplicate error state"
echo "25. MessageContext.jsx - removed duplicate error state"
echo "26. theme.js - removed useTheme() call"
echo "27. Created Logo.jsx"
echo "28. Created UserMenu.jsx"

echo ""
echo "Next steps: Continue fixing useTheme, error, useParams, and useEffect imports in remaining files"
