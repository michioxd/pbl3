import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function PageAdminNotFoundError() {
    const navigate = useNavigate();
    return (
        <div className="m-auto flex w-full flex-col items-center justify-center gap-2">
            <h1 className="text-[7rem] leading-tight font-bold">404</h1>
            <span className="font-medium">Trang không tồn tại</span>
            <p className="text-center text-muted-foreground">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
                <br />
                Hãy kiểm tra lại đường dẫn hoặc quay về trang chủ.
            </p>
            <div className="mt-6 flex gap-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </div>
        </div>
    );
}
