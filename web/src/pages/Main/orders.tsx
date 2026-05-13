import { getApiPassengerTickets } from "@/api";
import { Container, Heading, Table, Badge, Flex, Text, Card, Spinner, Button } from "@radix-ui/themes";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useStore } from "@/stores";
import LoginDialog from "@/dialogs/Login";

const PageManageOrders = observer(() => {
    const store = useStore();
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!store.user.isAuthenticated && !store.user.isLoading) {
            setAuthDialogOpen(true);
            return;
        }

        if (store.user.isAuthenticated) {
            const fetchTickets = async () => {
                try {
                    const res = await getApiPassengerTickets();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const ticketsData = Array.isArray(res) ? res : (res as any)?.data || [];
                    setData(ticketsData);
                } catch (err) {
                    setError(true);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchTickets();
        }
    }, [store.user.isAuthenticated, store.user.isLoading]);

    if (store.user.isLoading) {
        return <Container size="4" px="4" py="8"><Flex justify="center" py="9"><Spinner size="3" /></Flex></Container>;
    }

    if (!store.user.isAuthenticated) {
        return (
            <Container size="2" px="4" py="8">
                <Card size="4">
                    <Flex direction="column" align="center" gap="4">
                        <Heading size="6">Yêu cầu đăng nhập</Heading>
                        <Text color="gray">Vui lòng đăng nhập để xem đơn hàng của bạn.</Text>
                        <Button onClick={() => setAuthDialogOpen(true)}>Đăng nhập ngay</Button>
                    </Flex>
                </Card>
                <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container size="4" px="4" py="8">
                <Flex justify="center" py="9">
                    <Spinner size="3" />
                </Flex>
            </Container>
        );
    }

    if (error) {
        return (
            <Container size="4" px="4" py="8">
                <Card style={{ backgroundColor: "var(--red-3)", borderColor: "var(--red-6)" }}>
                    <Text color="red">Đã xảy ra lỗi khi tải danh sách đơn hàng.</Text>
                </Card>
            </Container>
        );
    }

    const tickets = data;

    return (
        <Container size="4" px="4" py="8">
            <Heading size="6" mb="5">
                Quản lý đơn hàng
            </Heading>
            {tickets.length === 0 ? (
                <Text color="gray">Bạn chưa có đơn hàng nào.</Text>
            ) : (
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Mã vé</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Chuyến xe</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Vị trí ghế</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Giá vé</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Trạng thái</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tickets.map((ticket, idx) => (
                            <Table.Row key={ticket.ticketId || ticket.ticketCode || idx}>
                                <Table.RowHeaderCell>{ticket.ticketCode || ticket.ticketId || "N/A"}</Table.RowHeaderCell>
                                <Table.Cell>{ticket.routeName || "N/A"}</Table.Cell>
                                <Table.Cell>{ticket.seatLabel || "N/A"}</Table.Cell>
                                <Table.Cell>{ticket.price ? `${ticket.price} VND` : "N/A"}</Table.Cell>
                                <Table.Cell>
                                    <Badge color={ticket.status === 0 ? "green" : "gray"}>
                                        {ticket.status === 0 ? "Đã xác nhận" : ticket.status}
                                    </Badge>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </Container>
    );
});

export default PageManageOrders;
