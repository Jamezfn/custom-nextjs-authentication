import { SignInForm } from "@/auth/nextjs/components//signInForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default async function SignIn() {
    return (
        <div className="container mx-auto p-4 max-w-187.5">
            <Card>
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                    <SignInForm />
                </CardContent>
            </Card>
        </div>
    )
}