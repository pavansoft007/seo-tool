import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export interface CrawlProgressProps {
  queue: number;
  completed: number;
  remaining: number;
  errors: number;
}

export function CrawlProgress({
  queue,
  completed,
  remaining,
  errors,
}: CrawlProgressProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Queue</CardDescription>
          <CardTitle className="text-2xl">{queue}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Completed</CardDescription>
          <CardTitle className="text-2xl">{completed}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Remaining</CardDescription>
          <CardTitle className="text-2xl">{remaining}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Errors</CardDescription>
          <CardTitle className="text-2xl">{errors}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
