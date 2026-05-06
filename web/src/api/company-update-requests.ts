const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5026";

type CompanyProfileUpdateRequestStatus = 0 | 1 | 2;

export type CompanyProfileUpdateRequestDto = {
    requestID: string;
    companyID: string;
    status: CompanyProfileUpdateRequestStatus;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    requestedAt: string;
    reviewedAt?: string | null;
    reviewNote?: string | null;
};

export type CreateCompanyProfileUpdateRequestDto = {
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
};

const buildHeaders = () => {
    const headers = new Headers({
        "Content-Type": "application/json",
    });
    const token = localStorage.getItem("auth_token");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
};

export async function getBusadminCompanyUpdateRequestCurrent(): Promise<CompanyProfileUpdateRequestDto | null> {
    const response = await fetch(`${baseUrl}/api/busadmin/company-update-requests/current`, {
        headers: buildHeaders(),
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Không thể tải yêu cầu cập nhật nhà xe.");
    }

    return (await response.json()) as CompanyProfileUpdateRequestDto;
}

export async function createBusadminCompanyUpdateRequest(
    body: CreateCompanyProfileUpdateRequestDto,
): Promise<void> {
    const response = await fetch(`${baseUrl}/api/busadmin/company-update-requests`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error("Không thể gửi yêu cầu cập nhật nhà xe.");
    }
}
