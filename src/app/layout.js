import "./globals.css";

export const metadata = {
    title: "АРМ Заведующий складом",
    description:
        "Автоматизированное рабочее место работника склада салона сотовой связи",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <div>{children}</div>
            </body>
        </html>
    );
}
