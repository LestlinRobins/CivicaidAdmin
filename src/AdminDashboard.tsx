import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import type {
  Report,
  ReportStatus,
  ReportWithVotes,
  Profile,
} from "./types/database";

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

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile for quick lookup
      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach((profile) => {
        profilesMap.set(profile.id, profile);
      });

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

          // Determine reporter name
          let reporter_name = "Anonymous";
          if (!report.is_anonymous) {
            const profile = profilesMap.get(report.user_id);
            reporter_name = profile?.full_name || profile?.email || "Unknown";
          }

          return {
            ...report,
            upvotes,
            downvotes,
            reporter_name,
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

  const getStatusColor = (
    status: ReportStatus,
  ): "warning" | "info" | "success" => {
    switch (status) {
      case "reported":
        return "warning";
      case "in_progress":
        return "info";
      case "resolved":
        return "success";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case "reported":
        return <AlertCircle size={16} />;
      case "in_progress":
        return <Clock size={16} />;
      case "resolved":
        return <CheckCircle2 size={16} />;
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

  const handleFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as ReportStatus | "all");
  };

  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((report) => report.status === statusFilter);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchReports}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h3" component="h1" fontWeight={700}>
            Civic Reports Admin
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshCw size={20} />}
            onClick={fetchReports}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Filter */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Reports</MenuItem>
              <MenuItem value="reported">Reported</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Reports Table */}
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: 2 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Title
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Reporter
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Location
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Votes
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Created
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow
                  key={report.id}
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {report.title}
                      </Typography>
                      {report.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {report.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {report.reporter_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.category}
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>{report.location_name || "N/A"}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(report.status)}
                      label={report.status.replace("_", " ")}
                      color={getStatusColor(report.status)}
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ThumbsUp size={16} color="#10b981" />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="#10b981"
                        >
                          {report.upvotes}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ThumbsDown size={16} color="#ef4444" />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="#ef4444"
                        >
                          {report.downvotes}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(report.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {report.status !== "reported" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() =>
                            updateReportStatus(report.id, "reported")
                          }
                        >
                          Reported
                        </Button>
                      )}
                      {report.status !== "in_progress" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() =>
                            updateReportStatus(report.id, "in_progress")
                          }
                        >
                          Progress
                        </Button>
                      )}
                      {report.status !== "resolved" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() =>
                            updateReportStatus(report.id, "resolved")
                          }
                        >
                          Resolved
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <Box py={8} textAlign="center">
              <Typography variant="h6" color="text.secondary">
                No reports found
              </Typography>
            </Box>
          )}
        </TableContainer>
      </Container>
    </Box>
  );
}
