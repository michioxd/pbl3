import { useState, useEffect } from "react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    getApiAdminSystemReviews,
    getApiAdminSystemReviewsByReviewId,
} from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { StarRating } from "./components/StarRating";
import { ReviewDetailDialog } from "./components/ReviewDetailDialog";

type ReviewListItem = {
    reviewID: string;
    ratingScore: number;
    comment: string | null;
    status: number;
    isFlagged: boolean;
    createdAt: string;
    tripRoute: string;
    companyName: string;
    tripDepartureTime: string;
    bookingContactName: string;
    bookingContactEmail: string;
};

type ReviewSummary = {
    totalReviews: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    flaggedCount: number;
    averageRating: number;
};

type ReviewsListResponse = {
    items: ReviewListItem[];
    totalCount: number;
    filteredCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: ReviewSummary;
};

type ReviewDetail = {
    reviewID: string;
    ratingScore: number;
    comment: string | null;
    status: number;
    isFlagged: boolean;
    createdAt: string;
    moderatedAt: string | null;
    moderationReason: string | null;
    tripRoute: string;
    companyName: string;
    tripDepartureTime: string;
    tripArrivalTime: string;
    bookingContactName: string;
    bookingContactEmail: string;
    bookingContactPhone: string;
    moderatedByUserEmail: string | null;
};

const formatReviewStatus = (
    status: number
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    switch (status) {
        case 0:
            return { label: "Chờ duyệt", variant: "secondary" };
        case 1:
            return { label: "Đã duyệt", variant: "default" };
        case 2:
            return { label: "Đã từ chối", variant: "destructive" };
        case 3:
            return { label: "Đã gắn cờ", variant: "destructive" };
        default:
            return { label: "Không rõ", variant: "outline" };
    }
};

export function PageAdminReviews() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [ratingFilter, setRatingFilter] = useState<string>("all");
    const [flaggedOnly, setFlaggedOnly] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 400);

    const [data, setData] = useState<ReviewsListResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery, statusFilter, ratingFilter, flaggedOnly, pageSize]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, string | number | boolean> = {
                    page,
                    pageSize,
                };

                if (debouncedSearchQuery) {
                    params.q = debouncedSearchQuery;
                }

                if (statusFilter !== "all") {
                    params.statuses = statusFilter;
                }

                if (ratingFilter !== "all") {
                    params.minRating = parseInt(ratingFilter);
                    params.maxRating = parseInt(ratingFilter);
                }

                if (flaggedOnly) {
                    params.flaggedOnly = true;
                }

                const response = await getApiAdminSystemReviews(params);
                if (response.error) {
                    throw new Error("Lỗi khi tải dữ liệu");
                }

                setData(response.data as ReviewsListResponse);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [page, pageSize, debouncedSearchQuery, statusFilter, ratingFilter, flaggedOnly]);

    const handleViewDetail = async (reviewId: string) => {
        try {
            const response = await getApiAdminSystemReviewsByReviewId({
                path: { reviewId },
            });

            if (response.error) {
                console.error("Lỗi khi tải chi tiết");
                return;
            }

            setSelectedReview(response.data as ReviewDetail);
            setDetailDialogOpen(true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSuccess = () => {
        // Refresh data
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, string | number | boolean> = {
                    page,
                    pageSize,
                };

                if (debouncedSearchQuery) {
                    params.q = debouncedSearchQuery;
                }

                if (statusFilter !== "all") {
                    params.statuses = statusFilter;
                }

                if (ratingFilter !== "all") {
                    params.minRating = parseInt(ratingFilter);
                    params.maxRating = parseInt(ratingFilter);
                }

                if (flaggedOnly) {
                    params.flaggedOnly = true;
                }

                const response = await getApiAdminSystemReviews(params);
                if (response.error) {
                    throw new Error("Lỗi khi tải dữ liệu");
                }

                setData(response.data as ReviewsListResponse);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    };

    const columns: ColumnDef<ReviewListItem>[] = [
        {
            accessorKey: "ratingScore",
            header: "Đánh giá",
            cell: ({ row }) => <StarRating rating={row.original.ratingScore} size="sm" />,
        },
        {
            accessorKey: "comment",
            header: "Nội dung",
            cell: ({ row }) => (
                <div className="max-w-xs truncate">
                    {row.original.comment || <span className="text-muted-foreground">Không có</span>}
                </div>
            ),
        },
        {
            accessorKey: "bookingContactName",
            header: "Người đánh giá",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.bookingContactName}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.bookingContactEmail}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "tripRoute",
            header: "Chuyến xe",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.tripRoute}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.companyName}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const statusInfo = formatReviewStatus(row.original.status);
                return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
            },
        },
        {
            accessorKey: "createdAt",
            header: "Ngày tạo",
            cell: ({ row }) => (
                <div className="text-sm">
                    {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
                </div>
            ),
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(row.original.reviewID)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: data?.items || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: data?.totalPages || 0,
    });

    const summary = data?.summary;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Kiểm duyệt đánh giá</h1>
                <p className="text-muted-foreground">
                    Quản lý và kiểm duyệt đánh giá của khách hàng
                </p>
            </div>

            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng đánh giá
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalReviews}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {summary.pendingCount}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.approvedCount}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã gắn cờ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {summary.flaggedCount}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đánh giá TB</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.averageRating.toFixed(1)}/5
                            </div>
                            <StarRating rating={Math.round(summary.averageRating)} size="sm" />
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách đánh giá</CardTitle>
                    <CardDescription>
                        {data?.filteredCount || 0} đánh giá
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex gap-4 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm nội dung, người đánh giá..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="0">Chờ duyệt</SelectItem>
                                <SelectItem value="1">Đã duyệt</SelectItem>
                                <SelectItem value="2">Đã từ chối</SelectItem>
                                <SelectItem value="3">Đã gắn cờ</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Số sao" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="5">5 sao</SelectItem>
                                <SelectItem value="4">4 sao</SelectItem>
                                <SelectItem value="3">3 sao</SelectItem>
                                <SelectItem value="2">2 sao</SelectItem>
                                <SelectItem value="1">1 sao</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant={flaggedOnly ? "default" : "outline"}
                            onClick={() => setFlaggedOnly(!flaggedOnly)}
                        >
                            {flaggedOnly ? "Hiển thị tất cả" : "Chỉ đã gắn cờ"}
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            Đang tải...
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            Không có kết quả.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị {(page - 1) * pageSize + 1} -{" "}
                                {Math.min(page * pageSize, data?.filteredCount || 0)} trong{" "}
                                {data?.filteredCount || 0} kết quả
                            </p>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="25">25 / trang</SelectItem>
                                    <SelectItem value="50">50 / trang</SelectItem>
                                    <SelectItem value="100">100 / trang</SelectItem>
                                    <SelectItem value="200">200 / trang</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Trước
                            </Button>
                            <div className="text-sm">
                                Trang {page} / {data?.totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= (data?.totalPages || 1)}
                            >
                                Sau
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ReviewDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                review={selectedReview}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
