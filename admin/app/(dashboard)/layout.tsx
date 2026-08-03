import{Sidebar}from'@/components/sidebar';
export default function DashboardLayout({children}:{children:React.ReactNode}){return <><Sidebar/><main className="min-h-screen p-5 lg:ml-64 lg:p-10"><div className="mx-auto max-w-7xl">{children}</div></main></>}
