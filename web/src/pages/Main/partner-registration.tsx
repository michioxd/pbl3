import { postApiPassengerUpgradeRequestsBusadmin } from "@/api";
import type { CreateBusAdminUpgradeRequestDto } from "@/api";
import { Container, Heading, Flex, Text, Card, Button, TextField, TextArea, Callout, Box } from "@radix-ui/themes";
import { observer } from "mobx-react-lite";
import { InfoCircledIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { useStore } from "@/stores";
import LoginDialog from "@/dialogs/Login";

const PagePartnerRegistration = observer(() => {
    const store = useStore();
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const [formData, setFormData] = useState<CreateBusAdminUpgradeRequestDto>({
        companyName: "",
        licenseNumber: "",
        hotline: "",
        reason: "",
    });
    const [errors, setErrors] = useState<{ companyName?: string }>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!store.user.isAuthenticated && !store.user.isLoading) {
            setAuthDialogOpen(true);
        }
    }, [store.user.isAuthenticated, store.user.isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.companyName.trim()) {
            setErrors({ companyName: "Vui lòng nhập tên nhà xe" });
            return;
        }
        
        setErrors({});
        setIsLoading(true);
        setIsError(false);
        try {
            await postApiPassengerUpgradeRequestsBusadmin({ body: formData });
            setIsSuccess(true);
        } catch (err) {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (store.user.isLoading) {
        return <Container size="2" px="4" py="8"><Text>Đang tải...</Text></Container>;
    }

    if (!store.user.isAuthenticated) {
        return (
            <Container size="2" px="4" py="8">
                <Card size="4">
                    <Flex direction="column" align="center" gap="4">
                        <Heading size="6">Yêu cầu đăng nhập</Heading>
                        <Text color="gray">Vui lòng đăng nhập để gửi yêu cầu trở thành đối tác.</Text>
                        <Button onClick={() => setAuthDialogOpen(true)}>Đăng nhập ngay</Button>
                    </Flex>
                </Card>
                <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
            </Container>
        );
    }

    if (isSuccess) {
        return (
            <Container size="2" px="4" py="8">
                <Callout.Root color="green">
                    <Callout.Icon>
                        <CheckCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>
                        Yêu cầu trở thành đối tác đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
                    </Callout.Text>
                </Callout.Root>
            </Container>
        );
    }

    return (
        <Container size="2" px="4" py="8">
            <Card size="4">
                <Heading size="6" mb="4">
                    Trở thành đối tác (Mở bán vé trên XeNhanh)
                </Heading>
                <Text color="gray" mb="6" as="p">
                    Vui lòng điền thông tin doanh nghiệp của bạn để yêu cầu nâng cấp tài khoản thành BusAdmin.
                </Text>

                {isError && (
                    <Callout.Root color="red" mb="5">
                        <Callout.Icon>
                            <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.</Callout.Text>
                    </Callout.Root>
                )}

                <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap="4">
                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                Tên nhà xe / doanh nghiệp <Text color="red">*</Text>
                            </Text>
                            <TextField.Root
                                placeholder="Nhập tên nhà xe"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                            {errors.companyName && (
                                <Text color="red" size="1" mt="1">{errors.companyName}</Text>
                            )}
                        </Box>

                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                Số giấy phép kinh doanh (Tùy chọn)
                            </Text>
                            <TextField.Root
                                placeholder="Nhập số giấy phép (nếu có)"
                                value={formData.licenseNumber || ""}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </Box>

                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                Hotline hỗ trợ (Tùy chọn)
                            </Text>
                            <TextField.Root
                                placeholder="Nhập số điện thoại hotline"
                                value={formData.hotline || ""}
                                onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                            />
                        </Box>

                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                Lý do / Mô tả thêm (Tùy chọn)
                            </Text>
                            <TextArea
                                placeholder="Mô tả về quy mô, tuyến đường hoạt động..."
                                rows={4}
                                value={formData.reason || ""}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </Box>

                        <Flex justify="end" mt="4">
                            <Button type="submit" loading={isLoading}>
                                Gửi yêu cầu nâng cấp
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Card>
        </Container>
    );
});

export default PagePartnerRegistration;
