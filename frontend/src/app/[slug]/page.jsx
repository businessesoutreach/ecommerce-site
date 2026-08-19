"use client";
import StaticPage from "@/views/StaticPage";
import { useParams } from "next/navigation";
export default function Page() { const params = useParams(); return <StaticPage slug={params.slug} />; }