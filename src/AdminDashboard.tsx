import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import type { Report, ReportStatus, ReportWithVotes } from "./types/database";
import "./AdminDashboard.css";

export function AdminDashboard() {
  const [reports, setReports] = useState<ReportWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch all interactions
      const { data: interactionsData, error: interactionsError } =
        await supabase.from("report_interactions").select("*");

      if (interactionsError) throw interactionsError;

      // Calculate votes for each report
      const reportsWithVotes: ReportWithVotes[] = (reportsData || []).map(
        (report: Report) => {
          const reportInteractions =
            interactionsData?.filter(
              (interaction) => interaction.report_id === report.id,
            ) || [];

          const upvotes = reportInteractions.filter(
            (interaction) => interaction.interaction_type === "upvote",
          ).length;

          const downvotes = reportInteractions.filter(
            (interaction) => interaction.interaction_type === "downvote",
          ).length;

          return {
            ...report,
            upvotes,
            downvotes,
          };
        },
      );

      setReports(reportsWithVotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateReportStatus(reportId: string, newStatus: ReportStatus) {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", reportId);

      if (error) throw error;

      // Update local state
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : report,
        ),
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  }

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case "reported":
        return "badge-warning";
      case "in_progress":
        return "badge-primary";
      case "resolved":
        return "badge-success";
      default:
        return "badge-default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((report) => report.status === statusFilter);

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchReports}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Civic Reports Admin Dashboard</h1>
        <button onClick={fetchReports} className="refresh-btn">
          Refresh
        </button>
      </header>

      <div className="filters">
        <label>
          Status Filter:
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ReportStatus | "all")
            }
          >
            <option value="all">All Reports</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>{reports.length}</h3>
          <p>Total Reports</p>
        </div>
        <div className="stat-card">
          <h3>{reports.filter((r) => r.status === "reported").length}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h3>{reports.filter((r) => r.status === "in_progress").length}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h3>{reports.filter((r) => r.status === "resolved").length}</h3>
          <p>Resolved</p>
        </div>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Votes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>
                  <div className="report-title">
                    <strong>{report.title}</strong>
                    {report.description && (
                      <p className="report-description">{report.description}</p>
                    )}
                  </div>
                </td>
                <td>
                  <span className="category-badge">{report.category}</span>
                </td>
                <td>{report.location_name || "N/A"}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusBadgeClass(report.status)}`}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <div className="votes">
                    <span className="upvotes">👍 {report.upvotes}</span>
                    <span className="downvotes">👎 {report.downvotes}</span>
                  </div>
                </td>
                <td>{formatDate(report.created_at)}</td>
                <td>
                  <div className="action-buttons">
                    {report.status !== "reported" && (
                      <button
                        onClick={() =>
                          updateReportStatus(report.id, "reported")
                        }
                        className="btn btn-small btn-warning"
                        title="Mark as Reported"
                      >
                        Reported
                      </button>
                    )}
                    {report.status !== "in_progress" && (
                      <button
                        onClick={() =>
                          updateReportStatus(report.id, "in_progress")
                        }
                        className="btn btn-small btn-primary"
                        title="Mark as In Progress"
                      >
                        In Progress
                      </button>
                    )}
                    {report.status !== "resolved" && (
                      <button
                        onClick={() =>
                          updateReportStatus(report.id, "resolved")
                        }
                        className="btn btn-small btn-success"
                        title="Mark as Resolved"
                      >
                        Resolved
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredReports.length === 0 && (
          <div className="no-reports">
            <p>No reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
