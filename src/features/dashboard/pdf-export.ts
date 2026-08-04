import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportDashboardToPdf(
  stats: {
    totalEvents: number;
    todayEvents: number;
    uniqueUsers: number;
    completionRate: number;
    avgFare: number;
    cancelledPct: number;
  },
  userName: string,
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Kamel Ride — Analytics Report", 20, 25);

  // Metadata
  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Generated for: ${userName}`, 20, 33);
  pdf.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 39);

  // Separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, 43, pageWidth - 20, 43);

  // KPI Summary
  pdf.setFontSize(14);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Key Metrics", 20, 53);

  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  const kpis = [
    `Total Events: ${stats.totalEvents}`,
    `Today's Events: ${stats.todayEvents}`,
    `Unique Users: ${stats.uniqueUsers}`,
    `Completion Rate: ${stats.completionRate.toFixed(0)}%`,
    `Average Fare: $${stats.avgFare.toFixed(2)}`,
    `Cancelled: ${stats.cancelledPct.toFixed(1)}%`,
  ];

  let y = 61;
  for (const kpi of kpis) {
    pdf.text(kpi, 25, y);
    y += 7;
  }

  // Capture charts as images
  try {
    const chartElements = document.querySelectorAll("[data-pdf-capture]");
    let chartY = y + 10;

    for (const el of Array.from(chartElements)) {
      const canvas = await html2canvas(el as HTMLElement, {
        backgroundColor: "#0a0f1a",
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      if (chartY + imgHeight > 270) {
        pdf.addPage();
        chartY = 20;
      }

      pdf.addImage(imgData, "PNG", 20, chartY, imgWidth, imgHeight);
      chartY += imgHeight + 10;
    }
  } catch {
    // Charts might not be available in all contexts
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text(
      `Kamel Ride Analytics — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  pdf.save(`kamel-ride-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
