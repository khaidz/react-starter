import { Portal } from '@mantine/core'
import { useLoadingStore } from '@/store/loading.store'
import styles from './global-loading.module.scss'

export function GlobalLoading() {
  const { count } = useLoadingStore()

  if (count === 0) return null

  return (
    <Portal>
      <div className={styles.box_loader} id="vib-v2018-loading">
        <div className={styles.loader}>
          <div className={`${styles.inner} ${styles.one}`} />
          <div className={`${styles.inner} ${styles.two}`} />
          <div className={`${styles.inner} ${styles.three}`} />
        </div>
      </div>
    </Portal>
  )
}
